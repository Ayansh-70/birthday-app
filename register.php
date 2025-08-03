<?php
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

$username = $data->username;
// IMPORTANT: Always hash passwords! Never store them in plain text.
$password = password_hash($data->password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $password);

if ($stmt->execute()) {
    // Get the new user's ID
    $user_id = $stmt->insert_id;

    // Start a session to log the user in immediately
    session_start();
    $_SESSION['loggedin'] = true;
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;

    echo json_encode(["success" => true, "message" => "Registration successful"]);
} else {
    echo json_encode(["success" => false, "message" => "Username already exists"]);
}

$stmt->close();
$conn->close();
?>