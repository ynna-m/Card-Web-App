var cardsOpened = [];
var cardsFlippedAll = false;
var saveEditID = -1;
var sfquestion = null;
var ssaveCardArray = null;
var sidSaved = null;
var stitle = null;
var deckShow = null; //currentDeck to show?
var deckPattern = {}; //currentDeckPattern blobs
var importedSaveList = null;

function initializeDeckPattern(){
    curDeck = JSON.parse(localStorage.getItem('curDeck'));

    if(!curDeck){
        // Create cache of default deck.
        var folder = "./img/cards/";
        var deckTitle;
        var cardHref = [];
        var cardNames = [];
        var promiseC=[];
    
        var deckCacheDefault = new Map();
    
        function getCardNamesHref(folder) {
            return new Promise(function(resolve, reject) {
              var xhr = new XMLHttpRequest();
              xhr.onload = function() {
                resolve(this.responseText);
              };
              xhr.onerror = reject;
              xhr.open('GET', folder);
              xhr.send();
            });
        }
    
        function toDataURL(cardName, url) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.onload = function() {
                var reader = new FileReader();
                reader.onloadend = function() {
                    deckCacheDefault.set(cardName,reader.result);
                    resolve(this.responseText);
                }
                reader.readAsDataURL(xhr.response);
                };
                xhr.open('GET', url);
                xhr.onerror = reject;
                xhr.responseType = 'blob';
                xhr.send();
            });
            
        }
    
        getCardNamesHref(folder)
        .then(function(data) {
            // Code depending on result
            $(data).find("a").attr("href", function (i, val) {
                if( val.match(/\.(jpe?g|png|gif)$/) ) { 
                    cardHref.push(folder + val);
                    cardNames.push(val.split('.').shift());
                }
            });     
            $(data).find("a").attr("href", function (i, val) {
                if( val.match(/\.(txt)$/) ) { 
                    deckTitle = val.split('.').shift();
                }
            });
            
            for(let i = 0; i<cardHref.length; i++){
                p=toDataURL(cardNames[i],cardHref[i]);
                promiseC.push(p);
            }
            Promise.all(promiseC).then(function(data){
                let db;
                let request = indexedDB.open("deck",3);
                request.onupgradeneeded = function(event) {
                    // Set the db variable to our database so we can use it!  
                    db = event.target.result;
                
                    // Create an object store named notes. Object stores
                    // in databases are where data are stored.
                    let deck = db.createObjectStore('deck', {keypath:"id",autoIncrement: true});
                    deck.createIndex('name','name');
                    deck.createIndex('deckList','deckList');
                }
                request.onsuccess = function(event) {
                    db = event.target.result;
                    let dataToStore = {name: deckTitle, deckList:deckCacheDefault};
                    let transaction = db.transaction('deck','readwrite');
                    let deckStore = transaction.objectStore('deck');
                    
                    
                    let query = deckStore.add(dataToStore);
    
                    query.onsuccess = function() {
                        // Clear the form, ready for adding the next entry
                        var deckShow;
                        deckShowrequest = deckStore.index('name').getKey(deckTitle);
                        deckShowrequest.onsuccess = function(){
                            deckShow = deckShowrequest.result;                                                    
                            localStorage.setItem("curDeck",JSON.stringify(deckShow));
                        
                            test = JSON.parse(localStorage.getItem("curDeck"));
    
                            initializeDeckPattern();
    
                        }
                    }
                    query.oncomplete = function(){
                        db.close();
                    }
                }
                request.onerror = function(event) {
                    alert('error opening database ' + event.target.errorCode);
                }
               
            });
        });   
    }
    else{
        let db;
        let request = indexedDB.open("deck",3);
        request.onupgradeneeded = function(event) {
            // Set the db variable to our database so we can use it!  
            db = event.target.result;
        
            // Create an object store named notes. Object stores
            // in databases are where data are stored.
            let deck = db.createObjectStore('deck', {keypath:"id",autoIncrement: true});
            deck.createIndex('name','name');
            deck.createIndex('deckList','deckList');
        }
        request.onsuccess = function(event) {
            db = event.target.result;
            let transaction = db.transaction('deck','readonly');
            let deckStore = transaction.objectStore('deck');
            
            // let query = deckStore.get(curDeck);
            let query = deckStore.getAllKeys()

            query.onsuccess = function(event){
                let idlist = event.target.result
                let countRequest = deckStore.count();
                countRequest.onsuccess = function() {
                    stringAppend = "";

                    let getAllDeckNames = deckStore.getAll()
                    getAllDeckNames.onsuccess = function(event){
                        for(let i = 0;i<countRequest.result;i++){
                            let appendString = "<a href='#' class='list-group-item list-group-item-action "+ 
                            "list-group-item-dark customDeck' id='"+idlist[i]+"'>"+
                            event.target.result[i].name+"</a>";
                            stringAppend+=appendString;
                        }
                        $("#customDeckList").html("");
                        $("#customDeckList").html(stringAppend);
                        db.close()
                    }

                    let getDeckDB = deckStore.get(parseInt(curDeck));
                    getDeckDB.onsuccess = function(data){
                        deckPattern.setDeckPattern = data.target.result.deckList;
                        deckShow=curDeck;
                    }
                }
            }  
        }
        request.onerror = function(event) {
            alert('error opening database ' + event.target.errorCode);
        }
    }
}

function initializeSaveList(){
    sidSaved = JSON.parse(localStorage.getItem("idSave"));
    if(sidSaved){
        sidSaved = sidSaved.map(Number);
    }
    
    stitle = JSON.parse(localStorage.getItem("title"));
    sfquestion = JSON.parse(localStorage.getItem("fquestion"));
    ssaveCardArray = JSON.parse(localStorage.getItem("saveCardArray"));
    stringAppend = "";
    if(sidSaved){
        for(let i = 0; i < sidSaved.length; i++){
            let appendString = "<a href='#' class='list-group-item"+
            " list-group-item-action list-group-item-dark savedquery' id="+sidSaved[i]+">"+stitle[i]+
            "</a>";
            stringAppend+=appendString
        }
        $("#SaveList").html("");
        $("#SaveList").html(stringAppend);
    }
}

function initializeCards(){
    // initializesCards. Technically their number naming convention. This is initialized in order
    var cards = [];
    for(let i = 0; i <= 21; i++){
        if(i<10){
            cards.push("000"+i);
        }
        else if(i>=10 && i<100){
            cards.push("00"+i)
        }
    }
    return cards;
}
function shuffleCards(){
    var cards=initializeCards();
    // shuffleCards. Gets the array from cardsArrange and rearranges them
    for (let i = cards.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = cards[i];
        cards[i] = cards[j];
        cards[j] = temp;
    }

    return cards;
}
function distributeCards(){
    var shuffledCards = shuffleCards(); //gets the shuffled cards
    for(let i = 0; i<shuffleCards.length; i++){
        cardsArrange.push(shuffleCards[i])
    }
    //Then the following outputs the images. the shuffled cards names are concatenated 
    var stringTopRow="";
    var stringMidRow="";
    var stringBotRow="";    
    for(let i = 0; i < 22; i++){
        if(i <= 6){
            let appendString = "<div class='myCard justify-content-center' id='"+shuffledCards[i]+"'>\n"+    
                    "<div class='myCard-Back front justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get('cardBack')+"'>\n"+
                    "</div>\n"+
                    "<div class='myCard-Front back justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(shuffledCards[i])+"'>\n"+
                    "</div>\n"+
                    "</div>\n";
            stringTopRow+=appendString;
            
        }
        else if(i >= 7 && i < 15){
            let appendString = "<div class='myCard justify-content-center' id='"+shuffledCards[i]+"'>\n"+    
                    "<div class='myCard-Back front justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get('cardBack')+"'>\n"+
                    "</div>\n"+
                    "<div class='myCard-Front back justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(shuffledCards[i])+"'>\n"+
                    "</div>\n"+
                    "</div>\n";
            stringMidRow+=appendString;
        }
        else if(i >= 15 && i < 22){
            let appendString = "<div class='myCard justify-content-center' id='"+shuffledCards[i]+"'>\n"+    
                    "<div class='myCard-Back front justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get('cardBack')+"'>\n"+
                    "</div>\n"+
                    "<div class='myCard-Front back justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(shuffledCards[i])+"'>\n"+
                    "</div>\n"+
                    "</div>\n";
            stringBotRow+=appendString;
        }
    }
    $("#top-row").html("");
    $("#middle-row").html("");
    $("#bottom-row").html("");
    $("#top-row").html(stringTopRow);
    $("#middle-row").html(stringMidRow);
    $("#bottom-row").html(stringBotRow);
}

function cardFlip(){
    myCard = $(".myCard");
    myCard.unbind().removeData();
    myCard.flip();
    myCard.flip(false);
    myCard.each(function(){
        $(this).on('flip:done',function(event){      
            if(cardsFlippedAll && $(this).data("flip-model").isFlipped){
                $(this).unbind().removeData();
            }
            else{
                cardFlipEvent(this);
                $(this).unbind().removeData();
            }
        });
    });
}
function cardFlipEvent(event){
    if(!(cardsFlippedAll||cardsOpened.includes(event.id))){
        cardsOpened.push(event.id)
    }
}
function cardFlipAll(){
    myCard = $(".myCard");
    $("#linkFlipAll").click(function() {
        flippedCards = 0;
        myCard.each(function(){
            if(!$(this).data("flip-model")){
                $(this).flip();
                $(this).flip(true);
                flippedCards++;
            }            
        });
        if(flippedCards == 0 || (flippedCards>0 && flippedCards<21)){
            myCard.flip(true);
            myCard.unbind().removeData();
            cardsFlippedAll = true;
        }
        else{
            myCard.flip();
            myCard.flip(false);
            cardFlip();
            cardsFlippedAll = false;
            if(cardsOpened.length>0){
                cardsOpened = []
            }
        }
    });
}
// 04/07/2021 add
function saveListClickItem(){
    mySavedItem = $('.savedquery');
    mySavedItem.each(function(){
        $(this).click(function(){
            getSaveId = $(this).attr("id");
            index = sidSaved.indexOf(parseInt(getSaveId));

            mtitle = stitle[index];
            mquestion = sfquestion[index];
            mcards = ssaveCardArray[index];


            htmltitle = $('#savedQueryModal').find('.modal-title');
            cardsString = "";
            stringTopRow = "";
            stringMidRow = "";
            stringBotRow = "";
            for(let i = 0; i < mcards.length; i++){
                if(i < 5){
                    let appendString = "<div class='cardSaved justify-content-center' id='"+mcards[i]+"'>\n"+    
                            "<div class='myCard-Front justify-content-center'>\n"+
                                "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(mcards[i])+"'>\n"+
                            "</div>\n"+
                            "</div>\n";
                    stringTopRow+=appendString;
                    
                }
                else if(i >= 5 && i < 15){
                    let appendString = "<div class='cardSaved justify-content-center' id='"+mcards[i]+"'>\n"+    
                            "<div class='myCard-Front justify-content-center'>\n"+
                                "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(mcards[i])+"'>\n"+
                            "</div>\n"+
                            "</div>\n";
                    stringMidRow+=appendString;
                }
                else if(i >= 15 && i < 22){
                    let appendString = "<div class='cardSaved justify-content-center' id='"+mcards[i]+"'>\n"+    
                            "<div class='myCard-Front justify-content-center'>\n"+
                                "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(mcards[i])+"'>\n"+
                            "</div>\n"+
                            "</div>\n";
                    stringBotRow+=appendString;
                }
            }

            htmltitle.html("");
            htmltitle.attr('id',"");
            $('#sQuestion').attr('value',mquestion);
            $('#stop').html("");
            $('#smiddle').html("");
            $('#sbottom').html("");

            htmltitle.html(mtitle);
            htmltitle.attr('id',getSaveId);
            $('#sQuestion').attr('value',mquestion);
            $('#stop').html(stringTopRow);
            $('#smiddle').html(stringMidRow);
            $('#sbottom').html(stringBotRow);

            $('#savedQueryModal').modal('show');
        });
    });
    $('#btnEditSave').click(function(){
        saveEditID = $('#savedQueryModal').find('.modal-title').attr("id");
        etitle = $('#savedQueryModal').find('.modal-title').text();
        equestion =  $('#sQuestion').val();
        toprow = $('#stop').html();
        midrow = $('#smiddle').html();
        bottomrow = $('#sbottom').html();

        $('#title').val("");
        $('#fquestion').val("");
        $('#top-save').html("");
        $('#middle-save').html("");
        $('#bottom-save').html("");

        $('#title').val(etitle);
        $('#fquestion').val(equestion);
        $('#top-save').html(toprow);
        $('#middle-save').html(midrow);
        $('#bottom-save').html(bottomrow);

        
        $('#savedQueryModal').modal('hide');
        $('#saveDrawModal').modal('show');
    });
}
function reShuffleClick(){
    $("#linkReshuffle").click(function() {
        if(cardsOpened.length>0){
            $('#reshuffleModalWarning').modal('show');
        }
        else{
            reShuffle();
        }
    });
    $(".btnReShuffle-yes").click(function(){   
        let div = $(this).parents(".modal");
        let idModal = "#"+div.attr("id");
        $(idModal).modal('hide');
        reShuffle();
    });
    $("#btnReShuffle-save").click(function(){
        $('#reshuffleModalWarning').modal('hide');
        $('#saveDrawModal').modal('show');
        saveModalPopulate();
    });
}
function reShuffle(){
    $("#loading-div").fadeIn(400,function(){
        distributeCards();
        cardFlip();
    });        
    $("#loading-div").delay(500).fadeOut("slow");
    cardsOpened = []
}
function saveDrawModalClick(){
    $("#linkSaveDraw").click(function() {
        if(cardsOpened.length==0){
            $('#saveDrawModalNone').modal('show');
        }
        else{
            $('#saveDrawModal').modal('show');
            saveModalPopulate();          
        }             
    });    
}
function saveModalPopulate(){
    stringTopRow="";
    stringMidRow="";
    stringBotRow="";
    for(let i = 0; i < cardsOpened.length; i++){
        if(i < 5){
            let appendString = "<div class='openedCard justify-content-center' id='"+cardsOpened[i]+"'>\n"+                        
                    "<div class='myCard-Front back justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(cardsOpened[i])+"'>\n"+
                    "</div>\n"+
                    "</div>\n";
            stringTopRow+=appendString;
            
        }
        else if(i >= 5 && i < 15){
            let appendString = "<div class='openedCard justify-content-center' id='"+cardsOpened[i]+"'>\n"+                        
                    "<div class='myCard-Front back justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(cardsOpened[i])+"'>\n"+
                    "</div>\n"+
                    "</div>\n";
            stringMidRow+=appendString;
        }
        else if(i >= 15 && i < 22){
            let appendString = "<div class='openedCard justify-content-center' id='"+cardsOpened[i]+"'>\n"+                        
                    "<div class='myCard-Front back justify-content-center'>\n"+
                        "<img class='my-card-img' src='"+deckPattern.getDeckPattern.get(cardsOpened[i])+"'>\n"+
                    "</div>\n"+
                    "</div>\n";
            stringBotRow+=appendString;
        }
    }
    $("#top-save").html("");
    $("#middle-save").html("");
    $("#bottom-save").html("");
    $("#top-save").html(stringTopRow);
    $("#middle-save").html(stringMidRow);
    $("#bottom-save").html(stringBotRow);  
}
function saveModalDrawSaveClick(){ 
    form = $("#validate-form")
    form.validate({
        onclick: true,
        onkeypress: true
    });
    $("#btnSaveDraw").click(function(event){
        if(form.valid()){
            gettitle = $("#title").val();
            getfquestion = $("#fquestion").val();
            
            //getItems first. Set them to an array
            cidSaved = JSON.parse(localStorage.getItem("idSave"));
            ctitle = JSON.parse(localStorage.getItem("title"));
            cfquestion = JSON.parse(localStorage.getItem("fquestion"));
            csaveCardArray = JSON.parse(localStorage.getItem("saveCardArray"));

            //If none, create, else append data,
            if(saveEditID>-1){
                index = cidSaved.indexOf(parseInt(saveEditID));
                ctitle[index] = gettitle;
                cfquestion[index] = getfquestion;

                localStorage.setItem("title",JSON.stringify(ctitle));
                localStorage.setItem("fquestion",JSON.stringify(cfquestion));
                
                saveEditID = -1;
                $("#title").val("");
                $("#fquestion").val("");
                $("#top-save").html("");
                $("#middle-save").html("");
                $("#bottom-save").html("");

                $('#saveDrawModal').modal('hide');
            }
            else if(!cidSaved){
                cidSaved = [0];
                ctitle = [gettitle];
                cfquestion = [getfquestion];
                csaveCardArray = [cardsOpened];
                
                localStorage.setItem("idSave",JSON.stringify(cidSaved));
                localStorage.setItem("title",JSON.stringify(ctitle));
                localStorage.setItem("fquestion",JSON.stringify(cfquestion));
                localStorage.setItem("saveCardArray",JSON.stringify(csaveCardArray));
                
                $("#title").val("");
                $("#fquestion").val("");

                $('#saveDrawModal').modal('hide');
                $('#reshuffleModalWarningAfterSave').modal('show');

                test = JSON.parse(localStorage.getItem("saveCardArray"));
            }
            else{
                tidSaved = parseInt(cidSaved[cidSaved.length - 1]) + 1;
                cidSaved.push(tidSaved);
                ctitle.push(gettitle);
                cfquestion.push(getfquestion);
                csaveCardArray.push(cardsOpened);

                localStorage.setItem("idSave",JSON.stringify(cidSaved));
                localStorage.setItem("title",JSON.stringify(ctitle));
                localStorage.setItem("fquestion",JSON.stringify(cfquestion));
                localStorage.setItem("saveCardArray",JSON.stringify(csaveCardArray));

                $("#title").val("");
                $("#fquestion").val("");
                $('#saveDrawModal').modal('hide');
                $('#reshuffleModalWarningAfterSave').modal('show');

                test = JSON.parse(localStorage.getItem("saveCardArray"));
            }
            //then setStorage
            initializeSaveList();
            saveListClickItem();
        }
    });
    // April 18. On Submit if all are true, save to cache
}
// April 20, needed functions: Edit saved query/, read zip file--upload custom deck--ongoing, export-import saved query 
function zipFunc(){
    var zip = new JSZip();
    form = $("#deckUpload-form")
    
    function validateUpload(el){
        if(!el){
            return false;
        }
        else if(el.name.split('.').pop()!="zip"){
            return false;
        }
        return JSZip.loadAsync(el)                                   // 1) read the Blob
        .then(function(zip) {
            let checkFiles=[];
            //Preliminary check to see if files inside have the right names
            zip.forEach(function(relativePath,zipEntry){
                checkFiles.push(zipEntry.name.split('.').shift())
            });
            if(checkFiles.length<23){
                $("#uploadWarning").html("The files inside the zip archive don't contain the right number of images. Please upload a different zip");
                // $("#uploadWarningModal").modal("show");
                // $('#uploadDeckModal').modal("hide");
                $("#btnUpload").html("Upload");
                $("#btnUpload").attr("disabled", false);
                message.setVal = false
                // return false;
            }
            else{
                let checkpass=null;
                for(let i=0;i<checkFiles.length;i++){                            
                    if(!checkFiles[i].match(/^0{2,3}[0-1][0-9]$|^0{2,3}[0-2][0-1]$|^cardBack$/)){
                        $("#uploadWarning").html("Invalid file names. Please upload a different zip");
                        // $("#uploadWarningModal").modal("show");
                        // $('#uploadDeckModal').modal("hide");
                        $("#btnUpload").html("Upload");
                        $("#btnUpload").attr("disabled", false);

                        message.setVal = false;
                        checkpass=false;
                        // return false;
                    }
                }
                if (checkpass==null){
                    message.setVal=true;
                }
                $("#btnUpload").html("Upload");
                $("#btnUpload").attr("disabled", false);                
            }   
            // return true;
        });
    }
    
    form.validate({
        focusInvalid:true,
        onsubmit:true,
        rules:{
            deckUpload:{
                extension:'zip'
            }
        }
    });
    var message={
        value:null,
        process() {
            form.valid();
        },
        get getVal() {
          return this.value;
        },
        set setVal(value) {
          this.value = value;
          this.process();
        }
    }
    jQuery.validator.addMethod("deckUpload",function(val,el){
        if(message.getVal==null){
            return true;
        }
        else if(message.getVal==false){
            return false
        }
        else{
            return true
        }
        
    },"The files inside the .zip archive are invalid. Please upload a different .zip archive.");
    $("#linkCustomDeck").click(function(){
        $("#uploadDeckModal").modal('show');
        $("#deckName").val('');
        $("#deckUpload").val('');
    });
    $("#deckUpload").on("change", function(evt){
        message.setVal=null;
        validateUpload($("#deckUpload")[0].files[0])
    })
    $("#btnUpload").on("click", function(evt) {
        if(form.valid()&&message.getVal==true){   
            // $("#deckUpload").val("");
            $("#btnUpload").attr("disabled", true);
            stringBtnChange ="<span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>"+
            "Loading...";
            $("#btnUpload").html(stringBtnChange);
            function handleFile(f) {
                let db;
                let request = indexedDB.open("deck",3);
                request.onupgradeneeded = function(event) {
                    // Set the db variable to our database so we can use it!  
                    db = event.target.result;
                
                    // Create an object store named notes. Object stores
                    // in databases are where data are stored.
                    let deck = db.createObjectStore('deck', {keypath:"id",autoIncrement: true});
                    deck.createIndex('name','name');
                    deck.createIndex('deckList','deckList');
                }
                request.onsuccess = function(event) {
                    db = event.target.result;
                }
                request.onerror = function(event) {
                    alert('error opening database ' + event.target.errorCode);
                }
                var deckList = new Map();
                var deckName = $('#deckName').val(); 
                var promises= [];
                JSZip.loadAsync(f)                                   
                    .then(function(zip) {             
                        //Continue if it passes checks
                        zip.forEach(function (relativePath, zipEntry) { 
                             promises.push(zipEntry.async("base64")
                                .then(function(content) {
                                    filetype=zipEntry.name.split('.').pop();
                                    filename=zipEntry.name.split('.').shift();
                                    imgURL = "data:image/"+filetype+";base64," + content;
                                    deckList.set(filename,imgURL);                                    
                                },
                                function(e) {
                                    console.log("Error reading " 
                                                + file.name + " : " 
                                                + e.message);
                                }));
                        });
                        //db upload here
                        Promise.all(promises).then(function(){
                            let data = {name: deckName, deckList:deckList};
                            transaction = db.transaction("deck","readwrite");
                            deckStore = transaction.objectStore('deck');
                            request = deckStore.add(data);
                            request.onsuccess = function() {
                                // Clear the form, ready for adding the next entry
                                var deckShow;
                                deckShowrequest = deckStore.index('name').getKey(deckName);
                                deckShowrequest.onsuccess = function(){
                                    deckShow = deckShowrequest.result;
                                    cCurrentDeck = JSON.parse(localStorage.getItem("curDeck"));

                                    cCurrentDeck = deckShow;
                                                                        
                                    localStorage.setItem("curDeck",JSON.stringify(cCurrentDeck));
                                    
                    
                                    test = JSON.parse(localStorage.getItem("curDeck"));

                                    initializeDeckPattern();
                                }                                
                                $('#deckName').val("");
                                $("#deckUpload").val("");
                                $('#uploadDeckModal').modal("hide")
                                $("#btnUpload").html("Upload");
                                $("#btnUpload").attr("disabled", false);
                            };
                            transaction.oncomplete = function() {
                                console.log('Transaction completed: database modification finished.');
                                db.close();
                            }
                            transaction.onerror = function() {
                                console.log('Transaction not opened due to error');
                            };
                           
                        });
                    }, function (e) {
                        alert("Error reading " + f.name + ": " + e.message);
                    });
            }
            var files = $("#deckUpload")[0].files[0];
            handleFile(files);
        }
       
    });
}
function deckListClickItem(){
    myDeckListItem = $('.customDeck');
    myDeckListItem.each(function(){
        $(this).click(function(){
            getDeckId = $(this).attr("id");

            localStorage.setItem("curDeck",JSON.stringify(getDeckId));
            initializeDeckPattern();
        });
    });
}
//Validation-for zip file-do list
 function format(x, y) {
    var z = {
        M: x.getMonth() + 1,
        d: x.getDate(),
        h: x.getHours(),
        m: x.getMinutes(),
        s: x.getSeconds()
    };
    y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
        return ((v.length > 1 ? "0" : "") + z[v.slice(-1)]).slice(-2)
    });

    return y.replace(/(y+)/g, function(v) {
        return x.getFullYear().toString().slice(-v.length)
    });
}
function exportSaveQueries(){
    exportSaves= $('#exportQueries');
    exportSaves.click(function(){
        sidSaved = JSON.parse(localStorage.getItem("idSave"));
        stitle = JSON.parse(localStorage.getItem("title"));
        sfquestion = JSON.parse(localStorage.getItem("fquestion"));
        ssaveCardArray = JSON.parse(localStorage.getItem("saveCardArray"));

        exportList={};
        for(let i = 0; i < sidSaved.length; i++){
            exportList[sidSaved[i]]={
                title: stitle[i],
                question: sfquestion[i],
                cards: ssaveCardArray[i]
            }
        }
        // Date.now();
        // date.format("MMddyyyy_hhmm");
        var date = format(new Date(Date.now()),"MMddyyyy_hhmmss")
        exportData = JSON.stringify(exportList);
        exportfilename = "queries_"+date+".json";
        exportfile='data:application/json;charset=utf-8,'+ encodeURIComponent(exportData)
        
        var a = document.createElement("a");
        // document.body.appendChild(a);

        a.href = exportfile;
        a.download = exportfilename;
        a.click();
        window.URL.revokeObjectURL(exportfile);
    })
}
function importSaveQueries(){
    importSaves = $('#importQueries');
    //add modal asking clear list or add to list
    importSaves.click(function(){
        var upload = document.createElement("input",);
        upload.setAttribute("type", "file");
        upload.click();
        upload.onchange=function(inputfile){
            var filereader = new FileReader();
            filereader.onload = function(file){
                var content = file.target.result;
                importedSaveList = JSON.parse(content); // Array of Objects.

                $("#saveListImportModal").modal('show');
            }
            filereader.readAsText(inputfile.target.files[0])
        };
    });
}
function saveListImportModal(){
    $("#btnAppendSaveList").click(function(){
        let idToIterate = Object.keys(importedSaveList);
        let iidSave = sidSaved;
        let ititle = stitle;
        let iquestion = sfquestion;
        let icardArray = ssaveCardArray;
        if(!iidSave){
            $("#btnRenewSaveList").click();
        }
        else{
            for(let i = 0; i<idToIterate.length;i++){
                idToSave = iidSave[iidSave.length-1]+1
                iidSave.push(idToSave);
                ititle.push(importedSaveList[i].title);
                iquestion.push(importedSaveList[i].question);
                icardArray.push(importedSaveList[i].cards)
            }
            localStorage.setItem("idSave",JSON.stringify(iidSave));
            localStorage.setItem("title",JSON.stringify(ititle));
            localStorage.setItem("fquestion",JSON.stringify(iquestion));
            localStorage.setItem("saveCardArray",JSON.stringify(icardArray));
            initializeSaveList();
            saveListClickItem();
            $('#saveListImportModal').modal('hide');
        }
        
    });
    $("#btnRenewSaveList").click(function(){
        let iidSave = Object.keys(importedSaveList);
        let ititle = [];
        let iquestion = [];
        let icardArray = [];
        for(let i = 0; i<iidSave.length;i++){
            ititle.push(importedSaveList[i].title);
            iquestion.push(importedSaveList[i].question);
            icardArray.push(importedSaveList[i].cards)
        }
        localStorage.setItem("idSave",JSON.stringify(iidSave));
        localStorage.setItem("title",JSON.stringify(ititle));
        localStorage.setItem("fquestion",JSON.stringify(iquestion));
        localStorage.setItem("saveCardArray",JSON.stringify(icardArray));
        
        initializeSaveList();
        saveListClickItem();
        $('#saveListImportModal').modal('hide');
    });
    $("#btnCancelImportSaveList").click(function(){
        importedSaveList = null;
    });
}
$(document).ready(function() {
    deckPattern = {
        value: null,
        process() {
            distributeCards();
            cardFlip();
            cardFlipAll();
            reShuffle();
            deckListClickItem();
        },
        get getDeckPattern() {
          return this.value;
        },
        set setDeckPattern(value) {
          this.value = value;
          this.process();
        }
      };
    initializeDeckPattern();
    
    reShuffleClick();
    saveDrawModalClick();
    saveModalDrawSaveClick();
    initializeSaveList();
    saveListClickItem();
    zipFunc();
    exportSaveQueries();
    importSaveQueries();
    saveListImportModal();
});