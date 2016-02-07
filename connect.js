module.exports = function (BLEAddr, cb) {

	BLEAddr = BLEAddr || "F0:F2:B1:3E:2F:D8";

	var sphero = require('sphero');
	var robot = sphero(BLEAddr);
	
	robot.connect(function () {
		
		console.log("Connected to " + BLEAddr);
		
		var rollOrig = robot.roll;
		var speed = 0;
		var angle = 0;
		
		robot.roll = function (sp, agle) {
			speed = sp;
			angle = agle;
			return rollOrig.call(robot, sp, agle);
		};
		
		robot.getSpeed = function () {
			return speed;
		};
		
		robot.getAngle = function () {
			return angle;
		}
		
		robot.startCalibration(function () {
			setTimeout(function () {
				robot.finishCalibration(function () {
					robot.roll(speed, angle);
					cb(robot);			
				});
			}, 2000);
		});
	})
};