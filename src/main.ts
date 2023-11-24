import * as net from 'net';
import { loadSync } from 'protobufjs';
import { connect } from 'mqtt';
import { Worker, subscribe, publish, send, encode } from '@mqtt-worker';
import path from 'path';

const server = net.createServer();
const topic = 'testtopic/hardcoded';
const client = connect('mqtt://broker.emqx.io');
const root = loadSync(path.resolve(__dirname, 'message.proto'));

function start() {
    server.on('connection', (socket: net.Socket) => {
        console.log(`socket: ${socket.remoteAddress}:${socket.remotePort}`);

        let workerData: Worker = {
            socket,
            data: Buffer.from(''),
            pubTopic: topic,
            subTopic: topic,
            subscribed: false,
        };

        socket.on('data', (data: Buffer) => {
            workerData = subscribe(workerData, client);
            workerData.data = encode(root, data);
            socket.emit('send', publish(workerData, client));
        });

        socket.once('send', (worker: Worker) => {
            send(worker, client, root);
        });
    });

    server.on('error', (err) => {
        throw err;
    });

    server.listen(8124, () => {
        console.log('server bound');
    });
}

start();
