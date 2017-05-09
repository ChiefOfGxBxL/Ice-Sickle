function spaceSelect(selElem, size) {
  selElem.classList.add('two-col-sel');

  var childOptions = selElem.querySelectorAll('option');

  for(var i = 0; i < childOptions.length; i++) {
    var parts = childOptions[i].innerText.split('|');

    if(parts.length == 2) {
        var spacesToAdd = (size || 60) - parts[0].trim().length - parts[1].trim().length,
            repeatSpace = function(num) {
            	return Array(num + 1).join('\u00a0');
            };

        // Set the text of the option to contain the padding spaces
        childOptions[i].innerText = parts[0] + repeatSpace(spacesToAdd) + parts[1] + repeatSpace(2);
    }
    else {
        // Otherwise we keep the childOptions innerText the same
    }
  }
}
