
function lol(things)
{
    /*function encodeNumberToString(number) {
        return btoa(number.toString());  // Using base64 encoding
      }*/
      
      function decodeStringToNumber(encodedString) {
        return parseInt(atob(encodedString), 10);  // Decode from base64
      }
      
      // Example usage:
      const number = things;
      //let encoded = encodeNumberToString(number);
      //console.log("Encoded:", encoded);
      
      const decoded = decodeStringToNumber(xorDecrypt(things, "PgrJrkwpeG9pd").slice(6,-6));
      //console.log("Decoded:", decoded);

      //for encoding testing
      /*encoded = 'he3dkf'+encoded+'isj3fk';
      function xorEncrypt(text, key) {
        let encryptedBytes = [];
        for (let i = 0; i < text.length; i++) {
            encryptedBytes.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        let base64 = btoa(String.fromCharCode(...encryptedBytes));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    */
    function xorDecrypt(encryptedBase64, key) {
        encryptedBase64 = encryptedBase64.replace(/-/g, '+').replace(/_/g, '/');
        let encryptedText = atob(encryptedBase64);
        let decryptedText = '';
        for (let i = 0; i < encryptedText.length; i++) {
            decryptedText += String.fromCharCode(encryptedText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        //console.log(decryptedText)
        return decryptedText;
    }
    /*
    const text = encoded;
    const key = "PgrJrkwpeG9pd";
    
    const encryptedText = xorEncrypt(text, key);
    //console.log("Encrypted Text: ", encryptedText);
    
    const decryptedText = xorDecrypt(encryptedText, key);
    //console.log("Decrypted Text: ", decryptedText);
    */
    return decoded;


      
}
export {lol};