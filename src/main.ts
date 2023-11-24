import * as net from 'net';
import { connect } from 'mqtt';
import { Worker, subscribe, publish, send } from '@mqtt-worker';

const server = net.createServer();
const topic = 'testtopic/hardcoded';
const client = connect('mqtt://broker.emqx.io');

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
      workerData.data = data;
      socket.emit('send', publish(workerData, client));
    });

    socket.once('send', (worker: Worker) => {
      send(worker, client);
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
