Object.prototype.renameProperty = function (oldName, newName) {
    // Do nothing if the names are the same
    if (oldName == newName || oldName.split(".").length != newName.split(".").length) {
		return this;
    }
	for (var obj in this) {
		// Check for the old property name to avoid a ReferenceError in strict mode.
		if (oldName.indexOf('.') >= 0) {
			if (obj.toString() == oldName.substring(0, oldName.indexOf('.'))) {
				if (typeof this[obj] == 'object') {
					this[obj] = this[obj].renameProperty (oldName.substring(oldName.indexOf('.') + 1), newName.substring(newName.indexOf('.') + 1));
				}
				if (typeof this[obj] == 'array') {
					for (i = 0 ; i < this[obj].length ; i++) {
						this[obj][i] = this[obj][i].renameProperty (oldName.substring(oldName.indexOf('.') + 1), newName.substring(newName.indexOf('.') + 1));
					}
				}
			}
		} else {
			if (this.hasOwnProperty(oldName)) {
				this[newName] = this[oldName];
				delete this[oldName];
			}
		}
	}
	return this;
};

var sourceObj = {
    "foo": "this is foo",
    "bar": {"baz": "this is baz",
			"qux": "this is qux"}
};

// the source, rename list
sourceObj.renameProperty('bar.baz', 'bar2.baz2');
print(JSON.stringify(sourceObj));
//replacedObj.stringify();
/*replacedObj output => {
        foooo: 'this is foo',
        bar: {baz: 'this is baz',
              quxxxx: 'this is qux'}
    };
*/
