<?php
header("Content-Type: application/json"); // We will always be returning JSON

$servername = "localhost";
$username = "root"; // Default XAMPP username
$password = "";     // Default XAMPP password
$dbname = "birthday_buddy";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}
?>