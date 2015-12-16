#!/bin/ksh

scriptName="${0##*/}"
scriptPath="${0%/*}"

function usage
{
	if [[ $# -eq 0 ]]
	then
		{
			echo -e "NAME\n"
			echo -e "  $scriptName changes the name of a property of JSON objects stored in a file.\n"
			echo -e "SYNOPSYS\n"
			echo -e "  $scriptName [-a] [-h] -n <newName> -o <oldName> [-p <prefix>] [-s <separator>] <file>...\n"
			echo -e "OPTIONS\n"
			echo -e "  The folowing options are now available.\n"
			echo -e "    -a"
			echo -e "      Asks to search the path anywhere, not only at the root of the structure.\n"
			echo -e "    -h"
			echo -e "      Prints this online help.\n"
			echo -e "    -n newName"
			echo -e "      The name to be given to the property.\n"
			echo -e "    -o oldName"
			echo -e "      The name of the property to be changed.\n"
			echo -e "    -p prefix"
			echo -e "      The prefix to put in the name of the result file. If you do not use this option, the original JSON file is overwriten, if you work with a BSON file, a JSON file is created.\n"
			echo -e "    -s separator"
			echo -e "      The character to use to separate property names in pathes. The default separator id dot (\".\").\n"
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
		} | more
		exitCode=0
	else
		exitCode=$1
		shift
		echo "$@"
	fi
	exit $exitCode
}

function encompassFile
{
	(
		jsonFile=$1
		{
			echo '{"dummy": ['
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
		} < "$jsonFile" > ".$jsonFile"
	)
}

separator='.'
dummy=dummy
# Modes are defined by numbers
# 0: Search the property from the root of the object
# 1: Search the property anywhere in the objects
# 2: Use regular expressions in pathes to search the property from the root of the object
# 3: Use regular expressions in pathes to search the property anywhere in the objects
mode=0
while getopts :ahn:o:p:s: option
do
	case $option in
		a)	[[ -n "$dummy" ]] && mode=$(($mode + 1))
			dummy='';;
		h)	usage;;
		n)	newName="$OPTARG";;
		o)	oldName="$OPTARG";;
		p)	prefix="$OPTARG";;
		s)	separator="$OPTARG";;
		:)	usage 1 "Option $OPTARG needs a value";;
		\?)	usage 1 "Unknown option $OPTARG";;
	esac
done
[[ -z "$newName" ]] && usage 2 "The -n option is mandatory"
[[ -z "$oldName" ]] && usage 2 "The -o option is mandatory"
shift $(($OPTIND - 1))
[[ $# -eq 0 ]] && usage 2 "No file specified"
i=0
while [[ $# -gt 0 ]]
do
	[[ "$1" != *"."@([bj])"son" ]] && usage 3 "Files names must end by .json or .bson"
	jsonFiles[((i++))]="$1"
	shift
done
[[ "$newName" == "$oldName" ]] && usage 3 "Old and new names must be different"
[[ $(echo "${newName//[^$separator]}" | wc -c) -ne $(echo "${oldName//[^$separator]}" | wc -c) ]] \
	&& usage 3 "Old and new names must have the same number of nodes"
[[ "$oldName" == "/"*"/" || "$oldName" == "/"*"/$separator"* || "$oldName" == *"$separator/"*"/" || "$oldName" == *"$separator/"*"/$separator"* ]] \
	&& mode=$(($mode + 2))

i=0
while [[ $i -lt ${#jsonFiles[$i]} ]]
do
	jsonFile="${jsonFiles[((i++))]}"
	jsonDir=""
	bsonFile=""

	if [[ "$jsonFile" == *'/'* ]]
	then
		jsonDir="${jsonFile%/*}/"
		cd "$jsonDir"
		jsonFile="${jsonFile##*/}"
	fi

	if [[ "$jsonFile" == *".bson" ]]
	then
		bsonFile="$jsonFile"
		jsonFile="${jsonFile%.bson}.json"
		bsondump "$bsonFile" >| "$jsonFile"
	fi
	encompassFile "$jsonFile"

	node $scriptPath/renameJSONProperty.js "$separator" "${dummy:+$dummy$separator}$oldName" "${dummy:+$dummy$separator}$newName" "$(pwd)/.$jsonFile" 2 $mode >| "$prefix$jsonFile"

	rm -f ".$jsonFile"
	[[ -n "$bsonFile" && -n "$prefix" ]] && rm "$jsonFile"
	[[ -n "$jsonDir" ]] && cd - > /dev/null
done
