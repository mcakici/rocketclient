<?php
class telemetryWebSocket {
    private $telemetrySocket = array();
    private $telemetryHost = "localhost";
    private $telemetryPorts = [4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009];
    private $clients = array();

    public function __construct() {
        error_reporting(E_ALL);
        date_default_timezone_set('Europe/Istanbul');
        $this->createWebSocket(5001);
    }

    public function __destruct() {
        unset($this->clients);
        unset($this->telemetrySocket);
    }

    function createWebSocket($port = 5001) {
        $host = 'localhost'; //host
        //$port = $port; //port
        $null = NULL; //null var

        //Create TCP/IP sream socket
        $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        //reuseable port
        socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);

        //bind socket to specified host
        socket_bind($socket, 0, $port);

        //listen to port
        socket_listen($socket);

        //create & add listning socket to the list
        $this->clients = array($socket);

        echo "Server is running on port $port..\n";

        //start endless loop, so that our script doesn't stop
        while (true) {
            //manage multipal connections
            $changed = $this->clients;
            //returns the socket resources in $changed array
            socket_select($changed, $null, $null, 0, 10);

            //check for new socket
            if (in_array($socket, $changed)) {
                $socket_new = socket_accept($socket); //accpet new socket
                $this->clients[] = $socket_new; //add socket to client array

                $header = socket_read($socket_new, 1024); //read data sent by the socket
                $this->perform_handshaking($header, $socket_new, $host, $port); //perform websocket handshake

                socket_getpeername($socket_new, $ip); //get ip address of connected socket
                $response = $this->mask(json_encode(array('type' => 'system', 'message' => $ip . ' connected'))); //prepare json data
                $this->send_message($response); //notify all users about new connection

                //make room for new socket
                $found_socket = array_search($socket, $changed);
                unset($changed[$found_socket]);

            }

            //loop through all connected sockets
            foreach ($changed as $changed_socket) {
                //check for any incomming data
                /* while (socket_recv($changed_socket, $buf, 1024, 0) >= 1) {
                $received_text = unmask($buf); //unmask data
                $tst_msg = json_decode($received_text); //json decode
                $_port = $tst_msg->port;
                //$_host = $tst_msg->host;

                //prepare data to be sent to client
                //$response_text = mask(json_encode(array('type' => 'usermsg', 'name' => $user_name, 'message' => $user_message)));
                //send_message(mask(json_encode())); //send data
                break 2; //exist this loop
                } */

                $buf = @socket_read($changed_socket, 1024, PHP_NORMAL_READ);
                if ($buf === false) {
                    // check disconnected client
                    // remove client for $clients array
                    $found_socket = array_search($changed_socket, $this->clients);
                    socket_getpeername($changed_socket, $ip);
                    unset($this->clients[$found_socket]);
                    //notify all users about disconnected connection
                    //$response = mask(json_encode(array('type' => 'system', 'message' => $_SESSION['username'] . ' disconnected')));
                    //send_message($response);
                }
            }

            $telemetryData = $this->getDataFromTelemetry();
            if ($telemetryData) {
                $this->send_message($this->mask($telemetryData));
            }

            // 500ms delay
            usleep(500 * 1000);

            //send_message(mask($_GET["p"]));
        }
        // close the listening socket
        socket_close($socket);
    }

    private function getDataFromTelemetry() {
        if (count($this->telemetrySocket) == 0) {
            $this->connectTCPSocket();
        }

        try {
            $outputArr = [];
            foreach ($this->telemetrySocket as $key => $socket) {
                $input = socket_read($socket, 2048, PHP_BINARY_READ);
                $input = bin2hex($input);
                if ($input === false || empty($input)) {
                    $this->connectTCPSocket($key);
                }

                $decodedFinalOutput = $this->telemetryDecode($input, $this->telemetryPorts[$key], $this->telemetryHost);
                if ($decodedFinalOutput !== null) {
                    $outputArr[] = ($decodedFinalOutput);
                }
            }
            return json_encode($outputArr);
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    private function connectTCPSocket($key = null) {
        if ($key !== null) {
            //socket_close($this->telemetrySocket[$key]);
            unset($this->telemetrySocket[$key]);

            $this->telemetrySocket[$key] = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
            if ($this->telemetrySocket[$key] === false) {
                echo "socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n";
            }

            $result = socket_connect($this->telemetrySocket[$key], $this->telemetryHost, $this->telemetryPorts[$key]);
            if ($result === false) {
                echo "socket_connect() failed.\nReason: ($result) " . socket_strerror(socket_last_error($this->telemetrySocket[$key])) . "\n";
            }
        } else {
            foreach ($this->telemetryPorts as $key => $port) {
                /* Create a TCP/IP socket. */
                $this->telemetrySocket[$key] = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
                if ($this->telemetrySocket[$key] === false) {
                    echo "socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n";
                }

                $result = socket_connect($this->telemetrySocket[$key], $this->telemetryHost, $port);
                if ($result === false) {
                    echo "socket_connect() failed.\nReason: ($result) " . socket_strerror(socket_last_error($this->telemetrySocket[$key])) . "\n";
                }
            }
        }
    }

    private function extractFloat($bytes) {
        if (strlen($bytes) < 8) {
            return null;
        }

        $unpacked = unpack('f', strrev(hex2bin($bytes)));
        return is_array($unpacked) && count($unpacked) > 0 ? $unpacked[1] : null;
    }

    private function telemetryDecode($byteSequence, $port = null, $address = null) {
        // Given byte sequence
        // $byteSequence = '82445353765737564c6d6280144b667c1c452d280e412e34f64c05e55800000000481380';
        // if (strlen($byteSequence) < 67)
        //     return null;

        // Define byte ranges for each telemetry value
        $altitudeBytes = substr($byteSequence, 26, 8); // 2
        $speedBytes = substr($byteSequence, 34, 8); // 10
        $accelerationBytes = substr($byteSequence, 42, 8); // 18
        $thrustBytes = substr($byteSequence, 50, 8); // 26
        $temperatureBytes = substr($byteSequence, 58, 8); // 34

        // Extract telemetry values without rounding and convert to integers
        $altitude = $this->extractFloat($altitudeBytes);
        $speed = $this->extractFloat($speedBytes);
        $acceleration = $this->extractFloat($accelerationBytes);
        $thrust = $this->extractFloat($thrustBytes);
        $temperature = $this->extractFloat($temperatureBytes);

        if (str_starts_with($altitude, 8.99) || str_starts_with($temperature, 8.99) || str_starts_with($acceleration, 8.99) || str_starts_with($thrust, 8.99) || str_starts_with($speed, 8.99)) {
            return null;
        }

        return ["address" => $address, "port" => $port, "altitude" => $altitude, "speed" => $speed, "acceleration" => $acceleration, "thrust" => $thrust, "temperature" => $temperature];

        // Print the results
        // echo "Altitude: $altitude meters\n";
        // echo "Speed: $speed m/s\n";
        // echo "Acceleration: $acceleration m/s²\n";
        // echo "Thrust: $thrust Newtons\n";
        // echo "Temperature: $temperature Celsius\n";
    }

    private function send_message($msg) {
        foreach ($this->clients as $changed_socket) {
            @socket_write($changed_socket, $msg, strlen($msg));
        }
        return true;
    }

    //Unmask incoming framed message
    private function unmask($text) {
        $length = ord($text[1]) & 127;
        if ($length == 126) {
            $masks = substr($text, 4, 4);
            $data = substr($text, 8);
        } elseif ($length == 127) {
            $masks = substr($text, 10, 4);
            $data = substr($text, 14);
        } else {
            $masks = substr($text, 2, 4);
            $data = substr($text, 6);
        }
        $text = "";
        for ($i = 0; $i < strlen($data); ++$i) {
            $text .= $data[$i] ^ $masks[$i % 4];
        }
        return $text;
    }

    //Encode message for transfer to client.
    private function mask($text) {
        $b1 = 0x80 | (0x1 & 0x0f);
        $length = strlen($text);

        if ($length <= 125) {
            $header = pack('CC', $b1, $length);
        } elseif ($length > 125 && $length < 65536) {
            $header = pack('CCn', $b1, 126, $length);
        } elseif ($length >= 65536) {
            $header = pack('CCNN', $b1, 127, $length);
        }

        return $header . $text;
    }

    //handshake new client.
    private function perform_handshaking($receved_header, $client_conn, $host, $port) {
        $headers = array();
        $lines = preg_split("/\r\n/", $receved_header);
        foreach ($lines as $line) {
            $line = chop($line);
            if (preg_match('/\A(\S+): (.*)\z/', $line, $matches)) {
                $headers[$matches[1]] = $matches[2];
            }
        }

        $secKey = $headers['Sec-WebSocket-Key'];
        $secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
        //hand shaking header
        $upgrade = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
            "Upgrade: websocket\r\n" .
            "Connection: Upgrade\r\n" .
            "WebSocket-Origin: $host\r\n" .
            "WebSocket-Location: ws://$host:$port/\r\n" .
            "Sec-WebSocket-Accept:$secAccept\r\n\r\n";
        socket_write($client_conn, $upgrade, strlen($upgrade));
    }
}

$telemetryWebSocket = new telemetryWebSocket();
?>
