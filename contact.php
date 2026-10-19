<?php
/**
 * Contact form handler for dentalclaimdesk.com.
 *
 * Emails each enquiry to the office inbox through the hosting server's mail
 * system. Nothing is stored on the website. Requests that ask for JSON (the
 * site's JavaScript) get a JSON reply; plain form posts get a short HTML page.
 */

// Never print PHP warnings into the response; they would break the JSON reply.
ini_set('display_errors', '0');

const MAIL_TO     = 'info@dentalclaimdesk.com';
const MAIL_FROM   = 'info@dentalclaimdesk.com';
const RATE_LIMIT  = 5;     // messages allowed per visitor...
const RATE_WINDOW = 3600;  // ...per hour (seconds)
const TOPICS = [
    'Insurance verification',
    'Claims & coding',
    'Denials & appeals',
    'AR follow-up',
    'Payment posting',
    'Full-cycle RCM',
];

function wants_json()
{
    return isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;
}

function finish($ok, $message, $status = 200)
{
    http_response_code($status);
    if (wants_json()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $title = $ok ? 'Message sent' : 'Message not sent';
    $text = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>' . $title . ' | Dental Claim Desk</title>'
        . '<link rel="stylesheet" href="assets/css/style.css"></head><body>'
        . '<section><div class="w narrow"><div class="card"><h2>' . $title . '</h2>'
        . '<p>' . $text . '</p><a class="btn" href="contact.html">Back to Contact</a>'
        . '</div></div></section></body></html>';
    exit;
}

function cut($value, $max)
{
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

// Single-line field: line breaks removed so it can never reach a mail header.
function field($key, $max)
{
    $value = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    return cut(trim(str_replace(["\r", "\n"], ' ', $value)), $max);
}

function too_many_messages()
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $file = sys_get_temp_dir() . '/dcd_contact_' . md5($ip);
    $now = time();
    $hits = [];
    $saved = @file_get_contents($file);
    if ($saved !== false) {
        foreach (explode(',', $saved) as $t) {
            if ((int) $t > $now - RATE_WINDOW) {
                $hits[] = (int) $t;
            }
        }
    }
    if (count($hits) >= RATE_LIMIT) {
        return true;
    }
    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return false;
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.html', true, 303);
    exit;
}

// Spam bots fill in the hidden "website" field. Report success so they move on.
if (field('website', 200) !== '') {
    finish(true, "Thank you, your message has been sent. We'll be in touch soon.");
}

$name     = field('name', 100);
$practice = field('practice', 150);
$email    = field('email', 200);
$topic    = field('topic', 60);
$message  = isset($_POST['message']) ? cut(trim(str_replace("\r\n", "\n", (string) $_POST['message'])), 5000) : '';

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish(false, 'Please enter your name, a valid email address and a short message.', 422);
}
if (!in_array($topic, TOPICS, true)) {
    $topic = 'General enquiry';
}
if (too_many_messages()) {
    finish(false, 'Too many messages have been sent from your connection. Please email us at ' . MAIL_TO . '.', 429);
}

$subject = 'Website enquiry: ' . $topic . ($practice !== '' ? ' - ' . $practice : '');
$body = "New enquiry from the contact form on dentalclaimdesk.com\n\n"
    . "Name:     " . $name . "\n"
    . "Practice: " . ($practice !== '' ? $practice : '-') . "\n"
    . "Email:    " . $email . "\n"
    . "Topic:    " . $topic . "\n\n"
    . "Message:\n" . $message . "\n";
$headers = implode("\r\n", [
    'From: Dental Claim Desk Website <' . MAIL_FROM . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

$sent = mail(MAIL_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . MAIL_FROM);

if ($sent) {
    finish(true, "Thank you, your message has been sent. We'll be in touch soon.");
}
finish(false, 'Sorry, your message could not be sent. Please email us directly at ' . MAIL_TO . '.', 500);
