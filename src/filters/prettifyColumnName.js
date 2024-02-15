const prettifyColumnName = (columnName) => {
    // Split the string on underscores and spaces
    let words = columnName.split(/[-\s]/);
  
    // Capitalize the first letter of the first word and make 'url' uppercase
    let title = words.map((word, index) => {
        console.log(`word: ${word}, word.toLowerCase(): ${word.toLowerCase()}`); 
        if (word.toLowerCase() === 'url') {
            return word.toUpperCase();
        } else if (index === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
            return word;
        }
    }).join(' ');
  
    return title;
}

export default prettifyColumnName