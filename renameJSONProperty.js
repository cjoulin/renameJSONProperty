Object.prototype.renameProperty2 = function (oldName, newName, toPrint) {
	var i;
	if (Object.prototype.toString.call(this) == '[object Array]') {
		// If the object is an array, we scan all its entries
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renameProperty2(oldName.substring(oldName), newName.substring(newName), toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			// If the object is an object and we want to access one of its' sub object
			if (oldName.split(".").length >= 2) {
				// We search for the wanted sub object and act on it
				for (var obj in this) {
					if (this[obj] === this[oldName.substring(0, oldName.indexOf('.'))]) {
						this[obj] = this[obj].renameProperty2(oldName.substring(oldName.indexOf('.') + 1), newName.substring(newName.indexOf('.') + 1), toPrint - 1);
						break;
					}
				}
			}
		}
	}
	// Now, we act for real
	if (oldName.split(".").length >= 2) {
		// We only keep the head of the path because it is the next field to be renamed
		oldName = oldName.substring(0, oldName.indexOf('.'));
		newName = newName.substring(0, newName.indexOf('.'));
	}
	// If it exists as a property and the name has to be changed
	if (oldName != newName && this.hasOwnProperty(oldName)) {
		// We change it
		this[newName] = this[oldName];
		delete this[oldName];
	}
	// We print the new object only if we are at the "print level"
	if (toPrint == 0) {
		console.log(JSON.stringify(this));
	}
	return this;
};

// The name of the property to rename
var oldPath = process.argv[2];
// The new name of the property
var newPath = process.argv[3];
// The file where to make the change
var jsonFile = process.argv[4];
// The print level : 1 for the main object, 2 for its' direct subobjects and so on
var printLevel = process.argv[5];

// Do nothing if the names are the same
if (oldPath == newPath || oldPath.split(".").length != newPath.split(".").length) {
	return this;
}
// We load the object from the file
var sourceObj = require(jsonFile);

// We start to rename
sourceObj.renameProperty2(oldPath, newPath, printLevel);
