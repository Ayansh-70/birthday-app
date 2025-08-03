<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
require 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    echo json_encode(["success" => false, "message" => "User not logged in"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all birthdays for the logged-in user
        $stmt = $conn->prepare("SELECT id, name, birth_date, profile_picture, notes FROM birthdays WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $birthdays = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(["success" => true, "data" => $birthdays]);
        $stmt->close();
        break;

    case 'POST':
        // Add or Edit a birthday
        $data = json_decode(file_get_contents("php://input"));
        $id = $data->id ?? null;
        $name = $data->name;
        $birth_date = $data->birthDate;
        $profile_picture = $data->profilePicture;
        $notes = $data->notes;

        if ($id) { // This is an edit
            $stmt = $conn->prepare("UPDATE birthdays SET name = ?, birth_date = ?, profile_picture = ?, notes = ? WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ssssii", $name, $birth_date, $profile_picture, $notes, $id, $user_id);
        } else { // This is a new entry
            $stmt = $conn->prepare("INSERT INTO birthdays (user_id, name, birth_date, profile_picture, notes) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("issss", $user_id, $name, $birth_date, $profile_picture, $notes);
        }

        if ($stmt->execute()) {
             $new_id = $id ? $id : $stmt->insert_id;
             echo json_encode(["success" => true, "message" => "Birthday saved", "id" => $new_id]);
        } else {
            echo json_encode(["success" => false, "message" => "Error saving birthday"]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        // Delete a birthday
        $id = $_GET['id']; // Get ID from query string e.g., /api/birthdays.php?id=5
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM birthdays WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $id, $user_id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Birthday deleted"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error deleting birthday"]);
            }
            $stmt->close();
        }
        break;
}

$conn->close();
?>