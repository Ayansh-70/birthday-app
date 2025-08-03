<?php
require 'db_connect.php';
session_start();

$data = json_decode(file_get_contents("php://input"));
$username = $data->username;
$password = $data->password;

$stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    // Verify the hashed password
    if (password_verify($password, $user['password'])) {
        $_SESSION['loggedin'] = true;
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        echo json_encode(["success" => true, "message" => "Login successful"]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid username or password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid username or password"]);
}

$stmt->close();
$conn->close();
?>