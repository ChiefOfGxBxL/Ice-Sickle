function spaceItemText(elem, size) {
    var parts = [
            (elem.label) ? elem.label.toString().trim() : '',
            (elem.value) ? elem.value.toString().trim() : ''
        ],
        spacesToAdd = size - parts[0].length - parts[1].length,
        repeatSpace = (num) => { return Array(num + 1).join('\u00a0'); };

    // Set the text of the option to contain the padding spaces
    return parts[0] + repeatSpace(spacesToAdd) + parts[1] + repeatSpace(2);
}

function createNewGroup(groupName) {
    var newGroup = document.createElement('optgroup');
    newGroup.setAttribute('label', groupName);

    return newGroup;
}

function createNewItem(item, events, size) {
    // Create an <option>
    var option = document.createElement('option');
    option.innerText = spaceItemText(item, size || defaultSize);

    if(item.data) {
        Object.keys(item.data).forEach((dataKey) => {
            option.setAttribute('data-' + dataKey, item.data[dataKey]);
        });

        // Also check if the value is modified from its 'default' value
        if(item.data.default && item.value !== item.data.default) {
            option.setAttribute('data-modified', 'true');
        }
    }

    if(events) {
        if(events.onDblClick) option.addEventListener('dblclick', events.onDblClick);
    }

    return option;
}

const defaultSize = 65;

class ListView {
    // items: []
    // An item may have: `label`, `value`, `default`

    constructor(startElements, events, size) {
        this.size = size || defaultSize;
        this.events = events;

        var select = document.createElement('select');
        select.className = 'listview';
        select.setAttribute('multiple', 'multiple');
        this.HTMLElement = select; // Stores the HTML Element of <select>

        // Stores group names and their <optgroup> elements
        this.groups = {};

        // Create the elements, and format
        this.Items = startElements || [];
        this.Draw();
    }

    get Size() { return this._size; }
    set Size(size) { this._size = size; }

    get HTMLElement() { return this.element; }
    set HTMLElement(ele) { this.element = ele; }

    get Items() { return this.items; }
    set Items(items) { this.items = items; }

    Add(item) {
        if(Array.isArray(item)) {
            item.forEach((i) => {
                this.Add(i);
            });
        }
        else {
            // Add an element to the collection
            this.Items.push(item);

            var newItem = createNewItem(item, this.events);

            if(item.group && !this.groups[item.group]) {
                // A new group must be created
                var newGroup = createNewGroup(item.group);
                this.HtmlElement.appendChild(newGroup);
            }

            if(item.group) {
                this.groups[item.group].appendChild(newItem);
            }
            else {
                this.HTMLElement.appendChild(newItem);
            }
        }
    }

    Draw() {
        this.Items.forEach((item) => {
            var newItem = createNewItem(item, this.events);

            if(item.group) {
                // Append element to correct group
                if(this.groups[item.group]) {
                    this.groups[item.group].appendChild(newItem);
                }
                else {
                    var newGroup = createNewGroup(item.group);
                    newGroup.appendChild(newItem);
                    this.groups[item.group] = newGroup;
                }
            }
            else {
                this.HTMLElement.appendChild(newItem);
            }
        });

        // Add all groups to the HTML Element
        Object.keys(this.groups).forEach((groupName) => {
            this.HTMLElement.appendChild(this.groups[groupName]);
        });
    }

    Clear() {
        this.Items = [];
        this.HTMLElement.innerHTML = '';
    }

    Refresh() {
        // Delete all HTML elements and re-draw
        this.HTMLElement.innerHTML = '';
        this.groups = {};
        this.Draw();
    }

    UpdateItem(itemKey, newValue) {
        for(var i = 0; i < this.Items.length; i++) {
            if(this.Items[i].label === itemKey) {
                this.Items[i].value = newValue;
                return;
            }
        }
    }
}

module.exports = ListView;
