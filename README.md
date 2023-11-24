# node-net

servidor TCP na port 8124, recebe mensagem de 'n' conexões via socket, encaminha para um broker MQTT, recebe as mensagens do broker e encaminha de volta para os 'n' sockets.
