const SortArray = (unsortedArray, propertyToSortBy) => {
    const sortedArray = unsortedArray.sort((a, b) => {
        let propertyA,
            propertyB;

        if (a.hasOwnProperty(propertyToSortBy) && b.hasOwnProperty(propertyToSortBy)) {
            propertyA = a.propertyToSortBy.toUpperCase();
            propertyB = b.propertyToSortBy.toUpperCase();
        }

        let comp = 0;
        if (propertyA > propertyB) comp = 1;
        else comp = -1;
        return comp;
    });
    return sortedArray;
};

let testArray = [{ id: 'test' }, { id: 'blub' }];
testArray = SortArray(testArray, Object.keys()[0]);
testArray;
