

var ObjectEditor = {
    Data: {
        Units: require('../WEdata/data/Units.json'),
        Items: require('../WEdata/data/Items.json')
    },
    Fields: {
        Units: require('../WEdata/fields/UnitMetaData.json'),
        Items: require('../WEdata/fields/ItemMetaData.json')
    },

    Find: {
        UnitFieldIdByLongName: function(longName) {
            // e.g. bountydice -> ubdi
            // TODO: time this function -- it may take too long for lookups

            for(var fieldKey in ObjectEditor.Fields.Units) {
                if( ObjectEditor.Fields.Units[fieldKey] &&
                    ObjectEditor.Fields.Units[fieldKey].field.toLowerCase() === longName.toLowerCase()) {
                    return fieldKey;
                }
            }

            // console.error('Unable to lookup unit field by long name:', longName);
            return null; // Unable to find by long name
        },
        UnitFieldLongNameById: function(id) {
            // e.g. ubdi -> bountydice
            return ObjectEditor.Fields.Units[id].field;
        }
    }
}

module.exports = ObjectEditor;
