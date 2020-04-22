export const StringArrayFunctions = () => {

    const sortArrayByProperty = (unsortedArray, propertyToSortBy) => {
        const sortedArray = unsortedArray.sort((a, b) => {
            const idA = a.id.toUpperCase();
            const idB = b.id.toUpperCase();

            let comp = 0;
            if (idA > idB) comp = 1;
            else comp = -1;
            return comp;
        });
        return sortedProperties;
    };
}
}

