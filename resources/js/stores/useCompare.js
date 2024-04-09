import { useLocalStorage, StorageSerializers } from '@vueuse/core';

export const compare = useLocalStorage('compare', {}, {
    serializer: StorageSerializers.object
});

export const createCompare = async function () {
    try {
        // get a new id for the user;
        let response = await magentoGraphQL(`mutation { createCompareList { ${config.queries.compare} } }`);

        compare.value = response.data.createCompareList;
    } catch (error) {
        Notify(window.config.translations.errors.wrong, 'error')
        console.error(error)
    }
}

export const refreshCompare = async function() {
    if (!compare.value?.uid) {
        return;
    }

    let response = await magentoGraphQL(`query($uid: ID!) { compareList(uid: $uid) { ${config.queries.compare} } }`, {
        uid: compare.value.uid
    })

    compare.value = response.data.compareList;

    if (!compare.value?.item_count) {
        clear();
    }
}

export const addProductToCompare = async function (products) {
    if (!compare.value?.uid || !products.length) {
        await createCompare()
    }

    let present = await productsInCompare(products)

    if (present) {
        Notify(window.config.translations.compare.already, 'error')

        return;
    }

    try {
        let response = await magentoGraphQL("mutation( $input: AddProductsToCompareListInput ) { addProductsToCompareList(input: $input) { uid } }", {
            input: {
                uid: compare.value.uid,
                products: products
            }
        })

        await refreshCompare()

        Notify(window.config.translations.compare.add);
    } catch (error) {
        Notify(window.config.translations.errors.wrong, 'error')
        console.error(error)
    }
}

export const productsInCompare = async function (ids) {
    let present = false;

    ids.forEach((id) => {
        compare.value.items.forEach((item) => {
            if (item.uid === id) {
                present = true;
            }
        })
    })

    return present;
}

export const removeProductFromCompare = async function(products) {
    if (!compare.value?.uid || !products.length) {
        return;
    }

    try {
        await magentoGraphQL('mutation($input: RemoveProductsFromCompareListInput) { removeProductsFromCompareList(input: $input) { uid } }', {
            input: {
                uid: compare.value.uid,
                products: products
            }
        })

        await refreshCompare()
    } catch (error) {
        Notify(window.config.translations.errors.wrong, 'error')
        console.error(error)
    }
}

export const clear = async function () {
    await magentoGraphQL('mutation($uid: ID!) { deleteCompareList(uid: $uid) { result } }', {
        uid: compare.value.uid
    })

    compare.value = {}
}