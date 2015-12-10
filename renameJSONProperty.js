/*
 * Finds the first property matching the given regular expression in the given object
 */
var findPropertyNamesByRegex = function(obj, re) {
	var key;
	var keys = [];
	var i = 0;
	for (key in obj) {
		if (Object.prototype.toString.call(this) != '[object Function]') {
			if (key.match(re) !== null) {
				keys[i++] = key;
			}
		}
	}
	return keys;
};

/*
 * Rename property from the root of the object
 */
Object.prototype.renamePropertyFromRoot = function (oldName, newName, toPrint) {
	var i;
	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyFromRoot(oldName, newName, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			if (oldName.split(separator).length >= 2) {
				for (var obj in this) {
					// We search for the needed object
					if (this[obj] === this[oldName.substring(0, oldName.indexOf(separator))]) {
						this[obj] = this[obj].renamePropertyFromRoot(oldName.substring(oldName.indexOf(separator) + 1), newName.substring(newName.indexOf(separator) + 1), toPrint - 1);
						break;
					}
				}
			}
		}
	}
	// We isolate the name of the property to change to make it "a leaf"
	if (oldName.split(separator).length >= 2) {
		oldName = oldName.substring(0, oldName.indexOf(separator));
		newName = newName.substring(0, newName.indexOf(separator));
	}
	// If the property must be modified, we do so
	if (oldName != newName && this.hasOwnProperty(oldName)) {
		this[newName] = this[oldName];
		delete this[oldName];
	}
	// We print the new object only if we are at the "print level"
	if (toPrint == 0) {
		console.log(JSON.stringify(this));
	}
	return this;
};

/*
 * Rename property from the root of the object using regular expressions
 */
Object.prototype.renamePropertyFromRootRE = function (oldName, newName, toPrint) {
	var i;
	var n;
	var name;
	var names = [];
	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyFromRootRE(oldName, newName, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			if (oldName.split(separator).length >= 2) {
				name = oldName.substring(0, oldName.indexOf(separator));
				names = [];
				// If the old name is a regexp
				if (name.match(/^\/.*\/$/)) {
					// We get all the matching properties
					names = findPropertyNamesByRegex(this, name.substring(1, name.length - 1));
				} else {
					names[0] = name;
				}
				for (var obj in this) {
					for (n = 0; n < names.length ; n++) {
						// We search all the asked properties to act on it
						if (this[obj] === this[names[n]]) {
							this[obj] = this[obj].renamePropertyFromRootRE(oldName.substring(oldName.indexOf(separator) + 1), newName.substring(newName.indexOf(separator) + 1), toPrint - 1);
						}
					}
				}
			}
		}
	}
	// Now, we act for real
	if (oldName.split(separator).length >= 2) {
		// We only keep the head of the path because it is the next field to be renamed
		oldName = oldName.substring(0, oldName.indexOf(separator));
		newName = newName.substring(0, newName.indexOf(separator));
	}
	names = [];
	// If the old name is a regexp
	if (oldName.match(/^\/.*\/$/)) {
		// We get all the matching properties
		names = findPropertyNamesByRegex(this, oldName.substring(1, oldName.length - 1));
	} else {
		names[0] = oldName;
	}
	// If it exists as a property and the name has to be changed
	if (oldName != newName) {
		if (newName.match(/^\/.*\/$/)) {
			// We suppress the "/" to use the regexp as a string to convert
			newName = newName.substring(1, newName.length - 1);
			for (n = 0; n < names.length ; n++) {
				if (this.hasOwnProperty(names[n])) {
					// We change it
					name = names[n].replace(names[n], newName),
					this[name] = this[names[n]];
					delete this[names[n]];
				}
			}
		} else {
			for (n = 0; n < names.length ; n++) {
				if (this.hasOwnProperty(names[n])) {
					// We change it
					this[newName] = this[names[n]];
					delete this[names[n]];
				}
			}
		}
	}
	// We print the new object only if we are at the "print level"
	if (toPrint == 0) {
		console.log(JSON.stringify(this));
	}
	return this;
};

/*
 * Rename property anywhere in the object
 */
Object.prototype.renamePropertyAnyWhere = function (oldName, newName, toPrint) {
	var i;
	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyAnyWhere(oldName, newName, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			if (oldName.split(separator).length >= 2) {
				for (var obj in this) {
					if (this[obj] === this[oldName.substring(0, oldName.indexOf(separator))]) {
						this[obj] = this[obj].renamePropertyAnyWhere(oldName.substring(oldName.indexOf(separator) + 1), newName.substring(newName.indexOf(separator) + 1), toPrint - 1);
					} else {
						this[obj] = this[obj].renamePropertyAnyWhere(oldName, newName, toPrint - 1);
					}
				}
			} else {
				for (var obj in this) {
					this[obj] = this[obj].renamePropertyAnyWhere(oldName, newName, toPrint - 1);
				}
			}
		}
	}
	if (oldName.split(separator).length >= 2) {
		oldName = oldName.substring(0, oldName.indexOf(separator));
		newName = newName.substring(0, newName.indexOf(separator));
	}
	if (oldName != newName && this.hasOwnProperty(oldName)) {
		this[newName] = this[oldName];
		delete this[oldName];
	}
	if (toPrint == 0) {
		console.log(JSON.stringify(this));
	}
	return this;
};

/*
 * Rename property anywhere in the object using regular expressions
 */
Object.prototype.renamePropertyAnyWhereRE = function (oldName, newName, toPrint) {
	var i;
	var n;
	var name;
	var names = [];
	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyAnyWhereRE(oldName, newName, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			if (oldName.split(separator).length >= 2) {
				name = oldName.substring(0, oldName.indexOf(separator));
				names = [];
				if (name.match(/^\/.*\/$/)) {
					names = findPropertyNamesByRegex(this, name.substring(1, name.length - 1));
				} else {
					names[0] = name;
				}
				if (names.length > 0) {
					for (var obj in this) {
						for (n = 0; n < names.length ; n++) {
							if (this[obj] === this[names[n]]) {
								this[obj] = this[obj].renamePropertyAnyWhereRE(oldName.substring(oldName.indexOf(separator) + 1), newName.substring(newName.indexOf(separator) + 1), toPrint - 1);
							} else {
								this[obj] = this[obj].renamePropertyAnyWhereRE(oldName, newName, toPrint - 1);
							}
						}
					}
				} else {
					for (var obj in this) {
						this[obj] = this[obj].renamePropertyAnyWhereRE(oldName, newName, toPrint - 1);
					}
				}
			} else {
				for (var obj in this) {
					// We search for the wanted sub object in sub objects
					this[obj] = this[obj].renamePropertyAnyWhereRE(oldName, newName, toPrint - 1);
				}
			}
		}
	}
	// Now, we act for real
	if (oldName.split(separator).length >= 2) {
		// We only keep the head of the path because it is the next field to be renamed
		oldName = oldName.substring(0, oldName.indexOf(separator));
		newName = newName.substring(0, newName.indexOf(separator));
	}
	names = [];
	if (oldName.match(/^\/.*\/$/)) {
		names = findPropertyNamesByRegex(this, oldName.substring(1, oldName.length - 1));
	} else {
		names[0] = oldName;
	}
	// If it exists as a property and the name has to be changed
	if (oldName != newName) {
		if (newName.match(/^\/.*\/$/)) {
			newName = newName.substring(1, newName.length - 1);
			for (n = 0; n < names.length ; n++) {
				if (this.hasOwnProperty(names[n])) {
					// We change it
					name = names[n].replace(names[n], newName),
					this[name] = this[names[n]];
					delete this[names[n]];
				}
			}
		} else {
			for (n = 0; n < names.length ; n++) {
				if (this.hasOwnProperty(names[n])) {
					// We change it
					this[newName] = this[names[n]];
					delete this[names[n]];
				}
			}
		}
	}
	// We print the new object only if we are at the "print level"
	if (toPrint == 0) {
		console.log(JSON.stringify(this));
	}
	return this;
};

var i = 2;
// The character to be used as separator of properties names in pathes
var separator = process.argv[i++];
// The name of the property to rename
var oldPath = process.argv[i++];
// The new name of the property
var newPath = process.argv[i++];
// The file where to make the change
var jsonFile = process.argv[i++];
// The print level : 1 for the main object, 2 for its' direct subobjects and so on
var printLevel = process.argv[i++];
// The search mode
// 0: Search the property from the root of the object
// 1: Search the property anywhere in the objects
// 2: Search the property from the root of the object using regular expression
// 3: Search the property anywhere in the objects using regular expression
var mode = process.argv[i++];

// Do nothing if the names are the same
if (oldPath == newPath || oldPath.split(separator).length != newPath.split(separator).length) {
	return this;
}
// We load the object from the file
var sourceObj = require(jsonFile);

// We start to rename
switch (parseInt(mode)) {
	case 0:
		sourceObj.renamePropertyFromRoot(oldPath, newPath, printLevel);
		break;
	case 1:
		sourceObj.renamePropertyAnyWhere(oldPath, newPath, printLevel);
		break;
	case 2:
		sourceObj.renamePropertyFromRootRE(oldPath, newPath, printLevel);
		break;
	case 3:
		sourceObj.renamePropertyAnyWhereRE(oldPath, newPath, printLevel);
		break;
}
