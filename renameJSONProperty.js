/*
 * Finds the properties with a name matching the given regexp in the given object
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
 * Gives an array containing the names of properties corresponding to the given name even if it is a regexp
 */
var buildNamesArray = function(obj, name) {
	var foundNames = [];

	if (name.match(/^\/.*\/$/)) {
		foundNames = findPropertyNamesByRegex(obj, name.substring(1, name.length - 1));
	} else {
		foundNames[0] = name;
	}

	return foundNames;
};

/*
 * Prints the given object if it is at the printing level
 */
var printObject = function(toPrint, obj) {
	if (toPrint == 0) {
		console.log(JSON.stringify(obj));
	}
};

/*
 * Get the names of the sub part of the given names
 */
var getSubPartNames = function(obj) {
	var localObj = JSON.parse(JSON.stringify(obj));

	localObj.old = localObj.old.substring(localObj.old.indexOf(separator) + 1);
	localObj.new = localObj.new.substring(localObj.new.indexOf(separator) + 1);

	return localObj;
};

/*
 * Get the names of the root given names
 */
var getRootPartNames = function(obj) {
	var localObj = JSON.parse(JSON.stringify(obj));

	if (localObj.old.split(separator).length >= 2) {
		localObj.old = localObj.old.substring(0, localObj.old.indexOf(separator));
		localObj.new = localObj.new.substring(0, localObj.new.indexOf(separator));
	}

	return localObj;
};

/*
 * Renames a property
 */
var renameProperty = function(obj, oldName, newName) {
	var localObj = JSON.parse(JSON.stringify(obj));

	if (obj.hasOwnProperty(oldName)) {
		obj[newName] = obj[oldName];
		delete obj[oldName];
	}
};

/*
 * Renames a property with a regexp
 */
var renamePropertyRegExp = function(obj, oldName, newName) {
	var localObj = JSON.parse(JSON.stringify(obj));

	if (obj.hasOwnProperty(oldName)) {
		obj[oldName.replace(oldName, newName)] = obj[oldName];
		delete obj[oldName];
	}
};

/*
 * Rename property from the root of the object
 */
Object.prototype.renamePropertyFromRoot = function (names, toPrint) {
	var i;

	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyFromRoot(names, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]' && names.old.split(separator).length >= 2) {
			for (var obj in this) {
				// We search for the needed object
				if (this[obj] === this[names.old.substring(0, names.old.indexOf(separator))]) {
					this[obj] = this[obj].renamePropertyFromRoot(getSubPartNames(names), toPrint - 1);
					break;
				}
			}
		}
	}
	var localNames = getRootPartNames(names);
	// If the property must be modified, we do so
	if (localNames.old != localNames.new) {
		renameProperty(this, localNames.old, localNames.new);
	}
	printObject(toPrint, this);

	return this;
};

/*
 * Rename property from the root of the object using regular expressions
 */
Object.prototype.renamePropertyFromRootRegExp = function (names, toPrint) {
	var i;
	var j;
	var name;
	var foundNames = [];
	var localNames = [];

	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyFromRootRegExp(names, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]' && names.old.split(separator).length >= 2) {
			foundNames = buildNamesArray(this, names.old.substring(0, names.old.indexOf(separator)));
			for (var obj in this) {
				for (j = 0; j < foundNames.length ; j++) {
					// We search all the asked properties to act on it
					if (this[obj] === this[foundNames[j]]) {
							this[obj] = this[obj].renamePropertyFromRootRegExp(getSubPartNames(names), toPrint - 1);
					}
				}
			}
		}
	}
	localNames = getRootPartNames(names);
	foundNames = [];
	foundNames = buildNamesArray(this, localNames.old);
	// If it exists as a property and the name has to be changed
	if (localNames.old != localNames.new) {
		if (localNames.new.match(/^\/.*\/$/)) {
			// We suppress the "/" to use the regexp as a string to convert
			localNames.new = localNames.new.substring(1, localNames.new.length - 1);
			for (j = 0; j < foundNames.length ; j++) {
				renamePropertyRegExp(this, foundNames[j], localNames.new);
			}
		} else {
			for (j = 0; j < foundNames.length ; j++) {
				renameProperty(this, foundNames[j], localNames.new);
			}
		}
	}
	printObject(toPrint, this);

	return this;
};

/*
 * Rename property anywhere in the object
 */
Object.prototype.renamePropertyAnyWhere = function (names, toPrint) {
	var i;
	var localNames = [];

	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyAnyWhere(names, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			if (names.old.split(separator).length >= 2) {
				for (var obj in this) {
					// We search for the needed object
					if (this[obj] === this[names.old.substring(0, names.old.indexOf(separator))]) {
						// We act in its sub objects
						this[obj] = this[obj].renamePropertyAnyWhere(getSubPartNames(names), toPrint - 1);
					} else {
						// If we do not find it, we search for it deeper
						this[obj] = this[obj].renamePropertyAnyWhere(names, toPrint - 1);
					}
				}
			} else {
				// If we are on the leaf of the wanted path...
				if (this[obj] !== this[names.old.substring(0, names.old.indexOf(separator))]) {
					// ...if it is not the one we are in, we search for it deeper
					for (var obj in this) {
						this[obj] = this[obj].renamePropertyAnyWhere(names, toPrint - 1);
					}
				}
			}
		}
	}
	if (Object.prototype.toString.call(this) != '[object Function]') {
		localNames = getRootPartNames(names);
		if (localNames.old != localNames.new) {
			renameProperty(this, localNames.old, localNames.new);
		}
	}
	printObject(toPrint, this);

	return this;
};

/*
 * Rename property anywhere in the object using regular expressions
 */
Object.prototype.renamePropertyAnyWhereRegExp = function (names, toPrint) {
	var i;
	var j;
	var name;
	var foundNames = [];
	var localNames = [];

	if (Object.prototype.toString.call(this) == '[object Array]') {
		// We scan the array
		for (i = 0 ; i < this.length ; i++) {
			this[i] = this[i].renamePropertyAnyWhereRegExp(names, toPrint - 1);
		}
	} else {
		if (Object.prototype.toString.call(this) == '[object Object]') {
			if (names.old.split(separator).length >= 2) {
				foundNames = buildNamesArray(this, names.old.substring(0, names.old.indexOf(separator)));
				if (foundNames.length > 0) {
					for (var obj in this) {
						for (j = 0; j < foundNames.length ; j++) {
							if (this[obj] === this[foundNames[n]]) {
								this[obj] = this[obj].renamePropertyAnyWhereRegExp(getSubPartNames(names), toPrint - 1);
							} else {
								this[obj] = this[obj].renamePropertyAnyWhereRegExp(names, toPrint - 1);
							}
						}
					}
				} else {
					for (var obj in this) {
						this[obj] = this[obj].renamePropertyAnyWhereRegExp(names, toPrint - 1);
					}
				}
			} else {
				foundNames = buildNamesArray(this, names.old);
				if (foundNames.length > 0) {
					for (var obj in this) {
						for (j = 0; j < foundNames.length ; j++) {
							// For the objects not matching one of the searched one
							if (this[obj] !== this[foundNames[j]]) {
								// We search for the wanted sub object in sub objects
								this[obj] = this[obj].renamePropertyAnyWhereRegExp(names, toPrint - 1);
							}
						}
					}
				} else {
					// If we did not find any of the wanted object, we search for them deeper
					for (var obj in this) {
						this[obj] = this[obj].renamePropertyAnyWhereRegExp(names, toPrint - 1);
					}
				}
			}
		}
	}
	// Now, we act for real
	localNames = getRootPartNames(names);
	foundNames = [];
	foundNames = buildNamesArray(this, localNames.old);
	// If it exists as a property and the name has to be changed
	if (localNames.old != localNames.new) {
		if (localNames.new.match(/^\/.*\/$/)) {
			localNames.new = localNames.new.substring(1, localNames.new.length - 1);
			for (j = 0; j < foundNames.length ; j++) {
				renamePropertyRegExp(this, foundNames[j], localNames.new);
			}
		} else {
			for (j = 0; j < foundNames.length ; j++) {
				renameProperty(this, foundNames[j], localNames.new);
			}
		}
	}
	printObject(toPrint, this);

	return this;
};

// The names given by parameters
var names = new Object();
// Counter to get parameters
var i = 2;

// The character to be used as separator of properties names in pathes
var separator = process.argv[i++];
// The name of the property to rename
names.old = process.argv[i++];
// The new name of the property
names.new = process.argv[i++];
// The file where to make the change
var jsonFile = process.argv[i++];
// The print level : 1 for the main object, 2 for its' direct subobjects and so on
var printLevel = process.argv[i++];
// The search mode
var mode = process.argv[i++];

// Do nothing if the names are the same
if (names.old == names.new || names.old.split(separator).length != names.new.split(separator).length) {
	return 1;
}
// We load the object from the file
var sourceObj = require(jsonFile);

// We start to rename
switch (parseInt(mode)) {
	case 0: // Search the property from the root of the object
		sourceObj.renamePropertyFromRoot(names, printLevel);
		break;
	case 1: // Search the property anywhere in the objects
		sourceObj.renamePropertyAnyWhere(names, printLevel);
		break;
	case 2: // Search the property from the root of the object using regular expression
		sourceObj.renamePropertyFromRootRegExp(names, printLevel);
		break;
	case 3: // Search the property anywhere in the objects using regular expression
		sourceObj.renamePropertyAnyWhereRegExp(names, printLevel);
		break;
}
