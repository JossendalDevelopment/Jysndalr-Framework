import { Model } from '../models/Model';

type StyleObject = {
    name: string;
    value: string;
};

type AttributeObject = {
    attr: string;
    value: string | true;
};

type ElementDetails = {
    attrs: AttributeObject[];
    children: any[];
    content: string;
    isSvg: boolean;
    node: HTMLElement;
    type: string;
};

export abstract class View<T extends Model<K>, K> {
    constructor(public parent: Element, public model: T) {
        this.bindModel();
    }

    abstract eventsMap(): { [key: string]: (event: any) => void };
    abstract template(): string;

    bindModel = (): void => {
        this.model.on('re-render', () => {
            this.render();
        });
    };

    createFragment(htmlStr: string) {
        let frag = document.createDocumentFragment(),
            temp = document.createElement('template');

        temp.innerHTML = htmlStr;

        while (temp.firstChild) {
            frag.appendChild(temp.firstChild);
        }

        return frag;
    }

    // TODO get bindEvents to bind only to the newly rendered template, not the whole document
    bindEvents = (fragment: DocumentFragment): void => {
        const eventsMap = this.eventsMap();
        // const frag = this.createFragment(this.template());
        // console.log('fragment', fragment, 'frag', frag);
        for (let key in eventsMap) {
            const [eventName, selector] = key.split(':');
            document.querySelectorAll(selector).forEach(el => {
                el.addEventListener(eventName, eventsMap[key]);
            });
        }
    };

    domParserSupported = (): boolean => {
        if (!window.DOMParser) return false;
        const parser = new DOMParser();
        try {
            parser.parseFromString('x', 'text/html');
        } catch (error) {
            return false;
        }
        return true;
    };

    stringToHTML = (str: string) => {
        if (this.domParserSupported()) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(str, 'text/html');
            return doc.body;
        }

        // fallback support for ie10
        const dom = document.createElement('div');
        dom.innerHTML = str;
        return dom;
    };

    createDOMMap = (element: HTMLElement, isSvg: boolean) => {
        // node: any - typescript doesn't understand that nodeType === 1 is a type check for  an element which will have attributes prop
        return Array.from(element.childNodes, (node: any) => {
            let details: ElementDetails = {
                content:
                    node.childNodes && node.childNodes.length > 0
                        ? null
                        : node.textContent,
                attrs:
                    node.nodeType === 1 // 1 is an element
                        ? (this.getAttributes(
                              node.attributes
                          ) as AttributeObject[])
                        : [],
                type:
                    node.nodeType === 3
                        ? 'text'
                        : node.nodeType === 8
                        ? 'comment'
                        : node.tagName.toLowerCase(),
                node: node,
                isSvg: isSvg || false,
                children: [],
            };
            details.isSvg = isSvg || details.type === 'svg';
            details.children = this.createDOMMap(node, details.isSvg);
            return details;
        });
    };

    getAttributes = (attributes: AttributeObject[]) => {
        return Array.prototype.map.call(attributes, attribute => {
            return {
                attr: attribute.name,
                value: attribute.value,
            };
        });
    };

    /*
     * Add attributes to an element
     * @param {Node} elem The element
     * @param {Array} atts The attributes to add
     */
    addAttributes = (elem: HTMLElement, attrs: AttributeObject[]) => {
        attrs.forEach((attribute: AttributeObject) => {
            // if attribute is class, set className,
            if (attribute.attr === 'class') {
                elem.className = attribute.value as string;
            } else if (attribute.attr == 'style') {
                // if its a style, diff and add/remove styles
                let styles = this.getStyleMap(attribute.value as string);
                styles.forEach((style: StyleObject) => {
                    this.diffStyles(elem, attribute.value as string);
                    // elem.style[style.name] = style.value;
                });
            } else {
                // else set as an attribute
                // || true is for attrs with no value like 'required'
                elem.setAttribute(attribute.attr, attribute.value || true);
            }
        });
        return elem;
    };

    removeAttributes = (elem: any, attrs: AttributeObject[]) => {
        attrs.forEach((attribute: AttributeObject) => {
            // If the attribute is a class, use className
            // Else if it's style, remove all styles
            // Otherwise, use removeAttribute()
            if (attribute.attr === 'class') {
                elem.className = '';
            } else if (attribute.attr === 'style') {
                this.removeStyles(
                    elem,
                    Array.prototype.slice.call(elem.styles)
                );
            } else {
                elem.removeAttribute(attribute.attr);
            }
        });
    };

    /*
     * Create an array map of style names and values
     * @param  {String} styles The styles
     * @return {Array}         The styles
     */
    getStyleMap = (styles: string) => {
        return styles.split(';').reduce((arr: StyleObject[], style: string) => {
            if (style.trim().indexOf(':') > 0) {
                let styleArr = style.split(':');
                arr.push({
                    name: styleArr[0] ? styleArr[0].trim() : '',
                    value: styleArr[1] ? styleArr[1].trim() : '',
                });
            }
            return arr;
        }, []);
    };

    /*
     * Make an HTML element
     * @param  {Object} elem The element details
     * @return {Node}        The HTML element
     */
    makeElem = (elem: any) => {
        let node: any;
        if (elem.type === 'text') {
            node = document.createTextNode(elem.content);
        } else if (elem.type === 'comment') {
            node = document.createComment(elem.content);
        } else if (elem.isSvg) {
            node = document.createElementNS(
                'http://www.w3.org/2000/svg',
                elem.type
            );
        } else {
            node = document.createElement(elem.type);
        }
        this.addAttributes(node, elem.attrs);

        // if node has children, run it again
        if (elem.children.length > 0) {
            elem.children.forEach((childElem: Element) => {
                node.appendChild(this.makeElem(childElem));
            });
        } else if (node.type !== 'text') {
            node.textContent = elem.content;
        }
        return node;
    };

    diff = (
        templateMap: ElementDetails[],
        domMap: any,
        elem: HTMLElement | DocumentFragment
    ) => {
        // if extra elements in the domMap, remove them
        let count = domMap.length - templateMap.length;
        if (count > 0) {
            // remove nodes
            for (; count > 0; count--) {
                domMap[domMap.length - count].node.parentNode.removeChild(
                    domMap[domMap.length - count].node
                );
            }
        }
        // diff each item in the template map
        templateMap.forEach((node, idx) => {
            // if element doesn't exist, create it
            if (!domMap[idx]) {
                elem.appendChild(this.makeElem(templateMap[idx]));
                return;
            }
            // if element is not the same type, replace it
            if (templateMap[idx].type !== domMap[idx].type) {
                domMap[idx].parentNode.replaceChild(
                    this.makeElem(templateMap[idx]),
                    domMap[idx].node
                );
            }
            // if attributes are different, update them
            this.diffAttrs(templateMap[idx], domMap[idx]);

            // if content is different, update it
            if (templateMap[idx].content !== domMap[idx].content) {
                domMap[idx].node.textContent = templateMap[idx].content;
                return;
            }

            // if target element should be empty, wipe it
            if (domMap[idx].children.length > 0 && node.children.length < 1) {
                domMap[idx].node.innerHTML = '';
                return;
            }

            // If element is empty and shouldn't be, build it up
            // This uses a document fragment to minimize reflows
            if (domMap[idx].children.length < 1 && node.children.length > 0) {
                const fragment = document.createDocumentFragment();
                this.diff(node.children, domMap[idx].children, fragment);
                elem.appendChild(fragment);
                return;
            }

            // if there are existing child elements that need to be modified, diff them
            if (node.children.length > 0) {
                this.diff(
                    node.children,
                    domMap[idx].children,
                    domMap[idx].node
                );
            }
        });
    };

    /*
     * Diff the attributes on an existing element versus the template
     * @param  {Object} template The new template
     * @param  {Object} existing The existing DOM node
     */
    diffAttrs = (template: ElementDetails, existing: ElementDetails) => {
        // get attrs to be removed
        let remove = existing.attrs.filter(attr => {
            let getAttr = template.attrs.find(newAttr => {
                return attr.attr === newAttr.attr;
            });
            return getAttr === undefined;
        });

        // get attrs to be replaced
        let change = template.attrs.filter(attr => {
            let getAttr = existing.attrs.find(existingAttr => {
                return attr.attr === existingAttr.attr;
            });
            return getAttr === undefined || getAttr !== attr.value;
        });

        // Add/remove any required attributes
        this.addAttributes(existing.node, change);
        this.removeAttributes(existing.node, remove);
    };

    diffStyles = (elem: HTMLElement, styles: string): void => {
        console.log('DIFF STYLES', elem);
        // Get style map
        let styleMap = this.getStyleMap(styles);

        // Get styles to remove
        let remove = Array.prototype.filter.call(elem.style, style => {
            let findStyle = styleMap.find(newStyle => {
                return (
                    newStyle.name === style &&
                    newStyle.value === elem.style[style]
                );
            });
            return findStyle === undefined;
        });

        // Add and remove styles
        this.removeStyles(elem, remove);
        this.changeStyles(elem, styleMap);
    };

    removeStyles = (elem: HTMLElement, styles: any[]): void => {
        styles.forEach(style => {
            elem.style[style] = '';
        });
    };

    changeStyles = (elem: HTMLElement, styles: any[]): void => {
        console.log('STYLES', styles);
        styles.forEach(style => {
            elem.style[style.name] = style.value;
        });
    };

    render = (): void => {
        const app = document.querySelector('#app') as HTMLElement;
        // this.parent.innerHTML = '';
        // const templateElement = document.createElement('template');
        // templateElement.innerHTML = this.template();
        // this.bindEvents(templateElement.content);
        // this.parent.append(templateElement.content);

        // const fragment = document.createDocumentFragment();
        // fragment.appendChild(this.template());

        const templateMap = this.createDOMMap(
            this.stringToHTML(this.template()),
            // this.stringToHTML(templateElement.content),
            false
        );
        // this.bindEvents(templateMap.content);
        const domMap = this.createDOMMap(app, false);
        this.diff(templateMap, domMap, app);

        setTimeout(() => {
            const templateElement = document.createElement('template');
            templateElement.innerHTML = this.template();
            this.bindEvents(templateElement.content);
        }, 1000);
        // console.log('CONTENT', templateElement.querySelectorAll('input'));

        // const templateElement = document.createElement('template');
        // templateElement.innerHTML = this.template();
        // this.bindEvents(templateElement.content);
    };
}
