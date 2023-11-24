# node-net

servidor TCP na port 8124, recebe mensagem de 'n' conexões via socket, encaminha para um broker MQTT, recebe as mensagens do broker e encaminha de volta para os 'n' sockets.

```console
yarn install; yarn run dev
```

com o server rodando, teste com netcat ou telnet
mande json no formato do arquivo proto.
```console
echo '{"awesomeField":"ola"}' | nc localhost 8124
```
