#!/bin/ksh

scriptName="${0##*/}"
scriptPath="${0%/*}"

function usage
{
	if [[ $# -eq 0 ]]
	then
		echo -e "NAME\n"
		echo -e "  $scriptName changes je name of a property of JSON objects stored in a file.\n"
		echo -e "SYNOPSYS\n"
		echo -e "  $scriptName [-a] -f <file> [-h] -n <newName> -o <oldName> [-s <separator>]\n"
		echo -e "OPTIONS\n"
		echo -e "  The folowing options are now available.\n"
		echo -e "    -a"
		echo -e "      Asks to search the path anywhere, not only at the root of the structure.\n"
		echo -e "    -f file"
		echo -e "      The name of the file containing the objects (it must end by \".json\"). Please note that each object must be writen on one line.\n"
		echo -e "    -h"
		echo -e "      Prints this online help.\n"
		echo -e "    -n newName"
		echo -e "      The name to be given to the property.\n"
		echo -e "    -o oldName"
		echo -e "      The name of the property to be changed.\n"
		echo -e "    -s separator"
		echo -e "      The character to use to separate property names in pathes. The default separator id dot (\".\").\n"
		echo -e "COMMENTS\n"
		echo -e "  The name of property must be given as a path of which parts are separated by dots."
		echo -e "  So, x.y.z represents the property z contained in the property y of the property x of your objects."
		echo -e "  You can change more than the name of the leaf of the path : you can replace x.y.z with x.y1.z1."
		echo -e "  Of course, if the property z exists as the child of another property of x.y, it is not renamed."
		echo -e "  If the number of parts of your pathes are diferent, nothing is done."
		exitCode=0
	else
		exitCode=$1
		shift
		echo "$@"
	fi
	exit $exitCode
}

separator='.'
dummy=dummy
# Modes are defined by numbers
# 0: Search the property from the root of the object
# 1: Search the property anywhere in the objects
# 2: Use regular expressions in old path
mode="0"
while getopts :af:hn:o:s: option
do
	case $option in
		a)	mode=$(($mode + 1))
			dummy='';;
		f)	jsonFile="$OPTARG";;
		h)	usage;;
		n)	newPath="$OPTARG";;
		o)	oldPath="$OPTARG";;
		s)	separator="$OPTARG";;
		\?)	usage 1 "Unknown option $OPTARG";;
	esac
done
[[ -z "$jsonFile" ]] && usage 2 "The -f option is madatory"
[[ -z "$newPath" ]] && usage 2 "The -n option is madatory"
[[ -z "$oldPath" ]] && usage 2 "The -o option is madatory"
[[ "$newPath" == "$oldPath" ]] && usage 3 "Old and new pathes must be different"
[[ "$oldPath" == "/"*"/" || "$oldPath" == "/"*"/$separator"* || "$oldPath" == *"$separator/"*"/" || "$oldPath" == *"$separator/"*"/$separator"* ]] \
	&& mode=$(($mode + 2))

if [[ "$jsonFile" == *'/'* ]]
then
	cd "${jsonFile%/*}"
	jsonFile="${jsonFile##*/}"
fi

{
	echo '{"dummy": ['
	comma=''
	while read line
	do
		if [[ -n "$line" ]]
		then
			echo "$object$comma$line"
			comma=','
		fi
	done
	echo "]}"
} < "$jsonFile" > ".$jsonFile"

node $scriptPath/renameJSONProperty.js "$separator" "${dummy:+$dummy$separator}$oldPath" "${dummy:+$dummy$separator}$newPath" "$(pwd)/.$jsonFile" 2 $mode

rm -f ".$jsonFile"
