/**
 * Having fun with the Sphero robot
 * 
 * Usage:
 * npm install sphero noble
 * node run.js
 * 
 * Node permissions for bluetooth adapter :
 * https://github.com/sandeepmistry/noble#running-on-linux
 * 
 */

"use strict";

var connect = require('./connect');
var robot = null;
var currentAngle = 0;
var currentSpeed = 0;

process.stdin.resume();
process.stdin.setEncoding('utf8');

var actions = {
	
	connect: function (orb, next, args) {
		connect(args[1], function (rb) {
			robot = rb;
			next();
		});
	},
	
	disconnect: function (orb, next, args) {
		if (!orb) {
			next();
			return;
		}
		
		orb.sleep(0,0,0, function () { 
			orb.disconnect(function () {
				robot = null;
				next();
			});
		});
	},
	
	speed: function (orb, next, args) {
		if (orb) {
			var angle = orb.getAngle();
			var speed = args[1] && parseInt(args[1]);
			if (typeof speed === "number") {
 				orb.roll(angle, speed);
			} else {
				console.log("Invalid Speed");
			}
		}
		next();
	},
	
	color: function (orb, next, args) {
		if (orb && args[1]) {
			orb.color(args[1]);
		}
		next();	
	},
	
	quit: function () {
		process.exit();
	}
	
};

function run(tasks, args, idx, deferd) {
	
	var deferred = deferd || Promise.defer();
	
	args = args || [];
	idx = (typeof idx === "number") ? idx  : 0;
	console.log(tasks[idx]);
	if (tasks[idx]) {
 		tasks[idx](robot, run.bind(null, tasks, args, idx + 1, deferred), args);
	} else {
		console.log("done");
		deferred.resolve();
	}
	
	return deferred.promise;
};

function prompt() {
	prompt.ready = true;
	process.stdout.write("$>");
}

function cleanup() {
	if (robot) {
		// @Todo sync
		actions.disconnect(robot, function () {});
		robot = 0;	
	}
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('uncaughtException', cleanup);

prompt();
process.stdin.on('data', function (text) {
	
	if (!prompt.ready) {
		return;
	}
	
	if (!text) {
		prompt();
		return;
	}
	
	prompt.ready = false;
	text = text.replace("\n", "");
	
	var args = text.split(' ');
	var command = args[0];
	var promise;
	
	console.log('received data: ' + command);
	
	switch (command) {
		case "exit":
		case "quit":
			promise = run([
				actions.disconnect,
				actions.quit
			]);
			break;
		case "disconnect":
			promise = run([ actions.disconnect ]);
			break;
		case "connect":
			promise = run([
				actions.disconnect,
				actions.connect
			], args)
			break;
		case "speed":
			promise = run([ actions.speed ], args);
			break;
		case "color":
			promise = run([ actions.color ], args);
			break;
		default:
			promise = Promise.resolve();
			console.log("Unknown command");
	}
	
	promise.then(prompt);
});
