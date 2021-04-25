<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
/*
Tested working with PHP5.4 and above (including PHP 7 )

 */
require_once './vendor/autoload.php';

use FormGuide\Handlx\FormHandler;


$pp = new FormHandler(); 

$recaptcha = $_POST['g-recaptcha-response'];

$validator = $pp->getValidator();
$validator->fields(['etitle','email'])->areRequired()->maxLength(50);
$validator->field('email')->isEmail();
$validator->field('emessage')->maxLength(2000);
$validator->field('g-recaptcha');


$pp->sendEmailTo('hypergattairobo@gmail.com'); // ← Your email here

echo $pp->process($_POST);
?>