function rtsCameraControl(camera, options) {

	this.camera = camera;
	options = options || {};
	this.domElement = options.domElement || document;
	this.moveSpeed = options.moveSpeed || 1;
	this.lookSpeed = options.lookSpeed || 0.1;
	this.maxFov = 500;
	this.minFov = 15;
	this.domElement.addEventListener('keydown', this.onKeyDown.bind(this), false);
	this.domElement.addEventListener('keyup', this.onKeyUp.bind(this), false);
	this.domElement.addEventListener('mousedown', this.onTouchStart.bind(this), false );
	this.domElement.addEventListener('mousemove', this.onTouchMove.bind(this), false );
	this.domElement.addEventListener('mouseup', this.onTouchEnd.bind(this), false );
	this.domElement.addEventListener('mousewheel', this.onMouseWheel.bind(this), false );
	this.domElement.addEventListener('DOMMouseScroll', this.onMouseWheel.bind(this), false ); // firefox

	this.dragging = false;
	this.mouseVector = new THREE.Vector3();
}

function checkMapBounds() {
}

rtsCameraControl.prototype = {

	update: function(delta, active) {

		// movement speed scaling factor according to zoom level
		var factor = this.camera.fov / this.maxFov;

		// forward/backward movement will be parallel to the XZ axis
		var offset = this.moveSpeed * factor;
		if (active == true) {
			if (this.moveForward) {
				var oldY = this.camera.position.y;
				this.camera.translateY(offset);
				this.camera.position.y = oldY;
			}
			if (this.moveBackward) {
				var oldY = this.camera.position.y;
				this.camera.translateZ(offset);
				this.camera.position.y = oldY;
			}
			if (this.moveLeft) {
				this.camera.translateX(-offset);
			}
			if (this.moveRight) {
				this.camera.translateX(offset);
			}

			this.camera.position.add(this.mouseVector.multiplyScalar(factor));

			checkMapBounds();
		}
	},
	onKeyDown: function (event) {
		switch (event.keyCode) {
			case 38: /*up*/
			case 87: /*W*/ {
				this.moveForward = true;
				break;
			}
			case 37: /*left*/
			case 65: /*A*/ {
				this.moveLeft = true;
				break;
			}
			case 40: /*down*/
			case 83: /*S*/ {
				this.moveBackward = true;
				break;
			}
			case 39: /*right*/
			case 68: /*D*/ {
				this.moveRight = true;
				break;
			}
		}
	},
	onKeyUp: function (event) {
		switch(event.keyCode) {
			case 38: /*up*/
			case 87: /*W*/ {
				this.moveForward = false;
				break;
			}
			case 37: /*left*/
			case 65: /*A*/ {
				this.moveLeft = false;
				break;
			}
			case 40: /*down*/
			case 83: /*S*/ {
				this.moveBackward = false;
				break;
			}
			case 39: /*right*/
			case 68: /*D*/ {
				this.moveRight = false;
				break;
			}
		}
	},
	onTouchStart: function (event) {

		// check for object intersection?

		// if no intersection, start dragging
		this.dragging = true;
		this.startPositionX = event.clientX;
		this.startPositionY = event.clientY;

	},
	onTouchMove: function (event) {

		this.mouseVector.set(0, 0, 0);
		var currentPositionX = event.clientX;
		var currentPositionY = event.clientY;

		if (this.dragging == true) {
			this.mouseVector.set(this.lookSpeed  * (this.startPositionX - currentPositionX), 0, this.lookSpeed * (this.startPositionY - currentPositionY));
		}
		// } else {
			// autoscroll
			// var width = this.domElement.body.clientWidth;
			// var height = this.domElement.body.clientHeight;

			// var screenBorder = 10; // this should probably be a percent, not a fixed value
			// if (currentPositionX < screenBorder) {
				// this.mouseVector.x = -this.moveSpeed;
			// }
			// if (currentPositionX > width - screenBorder) {
				// this.mouseVector.x = this.moveSpeed;
			// }
			// if (currentPositionY < screenBorder) {
				// this.mouseVector.z = -this.moveSpeed;
			// }
			// if (currentPositionY > height - screenBorder) {
				// this.mouseVector.z = this.moveSpeed;
			// }
		// }

	},
	onTouchEnd: function (event) {
		this.dragging = false;
		this.mouseVector.set(0, 0, 0);
	},
	onMouseWheel: function (event) {
		var delta = 0;

		if (event.wheelDelta) { // WebKit / Opera / Explorer 9
			delta = event.wheelDelta / 40;
		} else if (event.detail) { // Firefox
			delta = -event.detail / 3;
		}

		var currentFov = this.camera.fov;
		currentFov -= delta;
		if (currentFov < this.minFov) {
			currentFov = this.minFov;
		}
		if (currentFov > this.maxFov) {
			currentFov = this.maxFov;
		}
		this.camera.fov = currentFov;
		this.camera.updateProjectionMatrix();
	}

};
