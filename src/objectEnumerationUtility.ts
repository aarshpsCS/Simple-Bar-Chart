module powerbi.extensibility.visual {

    export function getValue<T>(objects: DataViewObjects
        , objectName: string
        , propertyName: string
        , defaultValue: T
    ): T {
        if (objects) {
            let object = objects[objectName];
            if (object) {
                let property: T = <T>object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    export function getCategoricalObjectValue<T>(category: DataViewCategoryColumn
        , index: number
        , objectName: string
        , propertyName: string
        , defaultValue: T
    ): T {
        let categoryObjects = category.objects;

        if (categoryObjects) {
            let categoryObject: DataViewObject = categoryObjects[index];
            if (categoryObject) {
                let object = categoryObject[objectName];
                if (object) {
                    let property: T = <T>object[propertyName];
                    if (property !== undefined) {
                        return property;
                    }
                }
            }
        }
        return defaultValue;
    }

}