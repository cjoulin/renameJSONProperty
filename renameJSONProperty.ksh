#!/bin/ksh

scriptName="${0##*/}"
scriptPath="${0%/*}"

# Prints the online help or an error message
function usage
{
	if [[ $# -eq 0 ]]
	then
		{
			echo -e "NAME\n"
			echo -e "  $scriptName changes the name of a property of JSON objects stored in a file.\n"
			echo -e "SYNOPSYS\n"
			echo -e "  $scriptName [-a] [-b] [-h] [-j] -n <newName> -o <oldName> [-p <prefix>] [-s <separator>] <file>...\n"
			echo -e "OPTIONS\n"
			echo -e "  The folowing options are now available.\n"
			echo -e "    -a"
			echo -e "      Asks to search the path anywhere, not only at the root of the structure.\n"
			echo -e "    -b"
			echo -e "      Asks to generate BSON files. Whithout this option, if an original file is a JSON one, the result file is a JSON file too.\n"
			echo -e "    -h"
			echo -e "      Prints this online help.\n"
			echo -e "    -j"
			echo -e "      Asks to generate JSON files. Whithout this option, if an original file is a BSON one, the result file is a BSON file too.\n"
			echo -e "    -n newName"
			echo -e "      The name to be given to the property.\n"
			echo -e "    -o oldName"
			echo -e "      The name of the property to be changed.\n"
			echo -e "    -p prefix"
			echo -e "      The prefix to put in the name of the result file."
			echo -e "      If you do not use this option, the original file is overwriten. If you use -b and/or -j option, it will depend of the file's type: for JSON file, if you only use the -b option, it will not be overwritten because the result will be a BSON file.\n"
			echo -e "    -s separator"
			echo -e "      The character to use to separate property names in pathes. The default separator is dot (\".\").\n"
			echo -e "    file"
			echo -e "      The name(s) of the file(s) containing the objects (it must end by \".json\" or \".bson\"). Please note that each object must be writen on one line.\n"
			echo -e "COMMENTS\n"
			echo -e "  The name of property must be given as a path of which parts are separated by dots or the separator you gave with -s option."
			echo -e "  So, x.y.z represents the property z contained in the property y of the property x of your objects."
			echo -e "  You can change more than the name of the leaf of the path: you can replace x.y.z with x.y1.z1."
			echo -e "  Of course, if the property z exists as the child of another property than x.y, it is not renamed."
			echo -e "  The old and new pathes must have the same number of nodes."
			echo -e "  When you put regular expressions in the path, you must use the Perl regexp syntax. Please note that you cannot use modifiers."
			echo -e "  If you put a regular expression in the old path that you do not want to replace, you just have to put the same expression in the nes name."
			echo -e "  If you use both -b and -j options, you will have both BSON and JSON files as result."
		} | more
		exitCode=0
	else
		exitCode=$1
		shift
		echo "$@" >& 2
	fi
	exit $exitCode
}

# Emcompasses the JSON objects listed in the given file into a dummy JSON object
# Each original object becomes an element of an array
function encompassFile # <file>
{
	(
		file=$1
		resultFile=$(mktemp .${file#.json}.$$.XXXX.json)
		{
			echo '{"dummy":['
			comma=''
			while read line
			do
				if [[ -n "$line" ]]
				then
					echo "$comma$line"
					comma=','
				fi
			done
			echo "]}"
		} < "$file" >> "$resultFile"
		# The name of the built file is returned to make the file usable in the calling context
		echo "$resultFile"
	)
}

makeBson=0
makeJson=0
newName=""
oldName=""
prefix=""
separator='.'
dummy=dummy
mode=0
# Modes are defined by the sum of bits used as flags
# +---+---------------------------------------------+
# |Bit|Meaning                                      |
# +---+---------------------------------------------+
# |1  |Search the property anywhere in the objects  |
# |2  |Use regular expressions in the property names|
# +---+---------------------------------------------+
while getopts :abhjn:o:p:s: option
do
	case $option in
		a)	[[ -n "$dummy" ]] && mode=$(($mode + 1))
			# In "anywhere" mode, we do not need to have the dummy property in the path
			dummy='';;
		b)	makeBson=1;;
		h)	usage;;
		j)	makeJson=1;;
		n)	[[ -n "$newName" ]] && usage 2 "There can be only one -n option"
			newName="$OPTARG";;
		o)	[[ -n "$oldName" ]] && usage 2 "There can be only one -o option"
			oldName="$OPTARG";;
		p)	[[ -n "$prefix" ]] && usage 2 "There can be only one -p option"
			prefix="$OPTARG";;
		s)	[[ "$separator" != '.' ]] && usage 2 "There can be only one -s option"
			separator="$OPTARG";;
		:)	usage 1 "Option $OPTARG needs a value";;
		\?)	usage 1 "Unknown option $OPTARG";;
	esac
done
[[ -z "$newName" ]] && usage 2 "The -n option is mandatory"
[[ -z "$oldName" ]] && usage 2 "The -o option is mandatory"
shift $(($OPTIND - 1))
[[ $# -eq 0 ]] && usage 2 "No file specified"
# We build an array of files checking that they are valid
i=0
while [[ $# -gt 0 ]]
do
	[[ "$1" != *"."@([bj])"son" ]] && usage 3 "Files names must end by .json or .bson, $1 does not"
	[[ -r "$1" ]] || usage 3 "$1 file does not exist or is not readable"
	jsonFiles[((i++))]="$1"
	shift
done
# We check the validity of given property names
[[ "$newName" == "$oldName" ]] && usage 3 "Old and new names must be different"
[[ $(echo "${newName//[^$separator]}" | wc -c) -ne $(echo "${oldName//[^$separator]}" | wc -c) ]] \
	&& usage 3 "Old and new names must have the same number of nodes"
# If the old name contains at least one regexp, we switch the regexp mode flag on
[[ "$oldName" == "/"*"/" || "$oldName" == "/"*"/$separator"* || "$oldName" == *"$separator/"*"/" || "$oldName" == *"$separator/"*"/$separator"* ]] \
	&& mode=$(($mode + 2))

i=0
while [[ $i -lt ${#jsonFiles[*]} ]]
do
	# We take the name of the next file
	jsonFile="${jsonFiles[((i++))]}"
	jsonDir=""
	bsonFile=""

	# If a path to the file is given
	if [[ "$jsonFile" == *'/'* ]]
	then
		# We save the path
		jsonDir="${jsonFile%/*}/"
		# and the name separatly
		jsonFile="${jsonFile##*/}"
		# and go to the directory
		cd "$jsonDir"
	fi

	echo "Treating $jsonFile"
	# If the file is a BSON one
	if [[ "$jsonFile" == *".bson" ]]
	then
		# We save its "BSON" name,
		bsonFile="$jsonFile"
		# build its' "JSON" name
		jsonFile="${jsonFile%.bson}.json"
		# and convert it from BSON to JSON format
		bsondump "$bsonFile" >| "$jsonFile" 2> /dev/null
	fi
	workFile=$(encompassFile "$jsonFile")

	# We treat the file
	node $scriptPath/renameJSONProperty.js "$separator" "${dummy:+$dummy$separator}$oldName" "${dummy:+$dummy$separator}$newName" "$(pwd)/$workFile" 2 $mode \
		>| "$prefix$jsonFile"

	# If we asked BSON files or if the original file is a BSON file and we did not ask for JSON files, we create a BSON file
	[[ $makeBson -eq 1 || ( -n "$bsonFile" && $makeJson -eq 0 ) ]] \
		&& python $scriptPath/renameJSONProperty.py "$prefix$jsonFile" "$prefix${jsonFile%.json}.bson"
	# If we did not ask JSON files and the original file is a BSON file, we delete the JSON file we created by the treatment
	[[ $makeJson -eq 0 && -n "$bsonFile" ]] \
		&& rm "$prefix$jsonFile"

	# We delete the temporary files...
	rm -f "$workFile"
	# ...(the .json file is concidered as temporary if we were treating a BSON file and a prefix was given,
	# meaning that we do not want to keep the .json file with its' originale name)...
	[[ -n "$bsonFile" && -n "$prefix" ]] && rm -f "$jsonFile"
	# ...and go back to our initial directory so the relative path of the next file can be handled
	[[ -n "$jsonDir" ]] && cd - > /dev/null
done
