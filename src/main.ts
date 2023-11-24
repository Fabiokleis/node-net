import * as net from 'net';
import { loadSync } from 'protobufjs';
import { connect } from 'mqtt';
import { Worker, subscribe, publish, send } from '@mqtt-worker';
import path from 'path';

const server = net.createServer();
const topic = 'testtopic/hardcoded';
const client = connect('mqtt://broker.emqx.io');
const root = loadSync(path.resolve(__dirname, 'message.proto'));

// tcp message structure json
interface Message {
  awesomeField: string;
  deviceName?: string;
}

function parseTcpBuffer(buffer: Buffer): Message {
  const { awesomeField, deviceName } = JSON.parse(buffer.toString());
  return {
    awesomeField,
    deviceName,
  };
}

function encode(data: Buffer): Buffer {
  // example code
  const AwesomeMessage = root.lookupType('awesomepackage.AwesomeMessage');

  let message = AwesomeMessage.create(parseTcpBuffer(data));
  console.log(`message = ${JSON.stringify(message)}`);

  let buffer = AwesomeMessage.encode(message).finish();
  console.log(`buffer = ${Array.prototype.toString.call(buffer)}`);

  return Buffer.from(buffer);
}

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

    socket.on('data', async (data: Buffer) => {
      workerData = subscribe(workerData, client);
      workerData.data = encode(data);
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
