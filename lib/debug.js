/*
 *   Summary.     debugObject
 *   Description. Pretty print an object to command line. Often for response objects which allow body removal for readability
 *
 *   @param  object   myobject    - Object to display
 *   @param  string   comment     - (Optional) Comment to append to debug output to help log readability
 *   @param  boolean  removeBody  - (Optional) remove body property of the object, helps make response objects much smaller and readable
 *   @return
 */
//pretty print an object (often a response), can leave optional comment to help find it in log,
//you can optionally remove properties (eg. body) to make things manageable
export function debugObject(myobject, comment = '', removeBody = false) {
    let output
    if(removeBody){
        output = JSON.stringify(myobject,hideBody,2)
    }else{
        output = JSON.stringify(myobject,null,2)
    }
    console.log("\r\n["+comment+"][Object]:" + output)
}

/*
 *   Summary.     hideBody
 *   Description. replacer function to hide body property used by JSON.stringify
 */
function hideBody(key, value) {
    if (key=="body") return undefined
    else return value
}