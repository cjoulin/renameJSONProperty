import sys
import json
from bson import BSON

sourceFile = open(sys.argv[1], "r")
destinationFile = open(sys.argv[2], "w")
for line in sourceFile:
	destinationFile.write(BSON.encode(json.loads(line.rstrip())))
