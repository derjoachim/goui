// noinspection JSUnusedGlobalSymbols

import {
	Observable,
	ObservableConfig,
	ObservableEventMap,
	ObservableListener,
	ObservableListenerOpts
} from "./Observable.js";
import {State} from "../State.js";
import {Collection} from "../util/Collection.js";

type findPredicate = string|Component|((comp: Component) => boolean | void);

export type ComponentConstructor<T extends Component> = new (...args: any[]) => T;
export interface ComponentEventMap<T extends Observable> extends ObservableEventMap<T> {
	/**
	 * Fires when the component renders and is added to the DOM
	 *
	 * @see Component.render()
	 * @param comp
	 */
	render?: (comp: T) => void,

	/**
	 * Fires after rendering but before adding the element to the dom
	 *
	 * @see Component.render()
	 * @param comp
	 */
	beforedom?: (comp: T) => void,

	/**
	 * Fires just before rendering
	 *
	 * @see Component.render()
	 * @param comp
	 */
	beforerender?: (comp: T) => void,

	/**
	 * Fires before the element is removed. You can cancel the remove by returning false
	 *
	 * @see Component.remove()
	 * @param comp
	 */
	beforeremove?: (comp: T) => false | void,

	/**
	 * Fires after the component has been removed
	 *
	 * @see Component.remove()
	 * @param comp
	 */
	remove?: (comp: T) => void,

	/**
	 * Fires before show. You can cancel the show by returning false
	 *
	 * @see Component.show()
	 * @param comp
	 */
	beforeshow?: (comp: T) => false |void,

	/**
	 * Fires after showing the component
	 *
	 * @see Component.show()
	 * @param comp
	 */
	show?: (comp: T) => void,

	/**
	 * Fires before hide. You can cancel the hide by returning false
	 *
	 * @see Component.hide()
	 * @param comp
	 */
	beforehide?: (comp: T) => false |void,

	/**
	 * Fires after hiding the component
	 *
	 * @see Component.show()
	 * @param comp
	 */
	hide?: (comp: T) => void,

	/**
	 * Fires on focus
	 *
 	 * @param comp
	 * @param o
	 */
	focus?: (comp: T, o?: FocusOptions) => void



}

export interface Component {
	on<K extends keyof ComponentEventMap<Component>>(eventName: K, listener: ComponentEventMap<Component>[K], options?: ObservableListenerOpts): void
	fire<K extends keyof ComponentEventMap<Component>>(eventName: K, ...args: Parameters<NonNullable<ComponentEventMap<Component>[K]>>): boolean
}

type CSSStyleConfig = Partial<CSSStyleDeclaration>;

export type ComponentState = Record<string, any>;

/**
 * @inheritDoc
 */
export interface ComponentConfig<T extends Observable> extends ObservableConfig<T> {
	/**
	 * Element ID
	 */
	id?: string

	/**
	 * Component item ID that can be used to lookup the Component inside a Component with Component.findItem() and Component.findItemIndex();
	 */
	itemId?: string

	/**
	 * Element's tagname. Defaults to "div"
	 */
	tagName?: keyof HTMLElementTagNameMap

	/**
	 * Class name to add to element
	 *
	 * Some common classes to add for layout:
	 *
	 * - hbox: Set's flex layout to horizontal boxes. Use flex: n to stretch columns
	 * - vbox: As above but vertical
	 * - fit: Fit the parent's size
	 * - scroll: Set's autoscroll: true
	 * - pad: Set common padding on the element
	 * - border-(top|bottom|left|right) to add a border
	 *
	 * Other:
	 *
	 * - fade-in: The component will fade in when show() is used.
	 * - fade-out: The component will fade out when hide is used.
	 *
	 */
	cls?: string

	/**
	 * Set the innerHTML
	 */
	html?: string

	/**
	 * Set the innerText
	 */
	text?: string

	/**
	 * Hide element
	 */
	hidden?: boolean,

	/**
	 * Disable element
	 */
	disabled?: boolean,

	/**
	 * Inline CSS Styles
	 */
	style?: CSSStyleConfig,

	/**
	 * Width in pixels
	 */
	width?: number,

	/**
	 * height in pixels
	 */
	height?: number

	/**
	 * Left offset in pixels
	 */
	left?: number,

	/**
	 * Top offset in pixels
	 */
	top?: number

	/**
	 * The tabindex attribute specifies the tab order of an element (when the "tab" button is used for navigating).
	 */
	tabIndex?: number

	/**
	 * Make it resizable
	 */
	resizable?: boolean

	/**
	 * CSS flex value
	 */
	flex?: string | number

	/**
	 * Title of the dom element
	 */
	title?: string

	/**
	 * ID used for storing state of the component in the State storage.
	 * If not set then the component won't store it's state
	 */
	stateId?: string
	/**
	 * @inheritDoc
	 */
	listeners?: ObservableListener<ComponentEventMap<T>>

	/**
	 * The child components
	 */
	items?: Component[]

}


/**
 * Component
 *
 * A component in its simplest form.
 *
 * @example
 *
 * ```typescript
 * Component.create({
 *   tagName: "hr",
 *   cls: "special"
 * })
 * ```
 */
export class Component extends Observable {

	protected tagName = "div" as keyof HTMLElementTagNameMap

	protected cls?: string;

	/**
	 * A base class not configurable. cls can be used to add extra classes leaving this class alone
	 *
	 * @protected
	 */
	protected baseCls: string = "";

	protected resizable = false

	protected html? : string

	protected text?: string

	protected rendered = false

	/**
	 * Keep boolean state so creating el is not needed to determine visibility
	 * @private
	 */
	protected hidden = false

	protected disabled = false

	protected el?: HTMLElement

	protected id : string = "";

	/**
	 * Component item ID that can be used to lookup the Component inside a Component with Component.findItem() and
	 * Component.findItemIndex();
	 */
	public itemId : string = "";

	protected style?: CSSStyleConfig;

	protected width?: number;
	protected height?: number;

	protected tabIndex?: number;
	protected flex?: string | number;

	protected stateId?: string;

	protected title?: string;

	/**
	 * When this item is added to a Component this is set to the parent Component
	 */
	public parent?: Component;

	private items?: Collection<Component>;
	protected top?: number;
	protected left?: number;

	private _mask: Mask | undefined;

	public static create<T extends typeof Observable>(this: T, config?: ComponentConfig<InstanceType<T>>, ...items:Component[]) {
		const comp =  super.create(config) as InstanceType<T>;
		if(items.length) {
			(comp as Component).getItems().replace(items);
		}
		return comp;
	}

	/**
	 * @inheritDoc
	 */
	protected init() {

		if (this.stateId) {
			this.restoreState(this.getState());
		}

		if(this.items) {
			this.initItems();
		}

		super.init();
	}

	protected applyConfig(config: any) {
		if(Array.isArray(config.items)) {
			config.items = new Collection<Component>(config.items);
		}
		super.applyConfig(config);
	}

	private initItems()  {

		this.getItems().on("add", (collection, item, index) => {
			this.setupItem(item);

			const refItem = index < collection.count() - 1 ? this.getItems().get(index) : undefined;

			if (this.isRendered()) {
				this.renderItem(item, refItem);
			}

		});

		this.getItems().on("remove", (collection, item, index) => {
			item.parent = undefined;
			item.remove();
		});

		this.getItems().forEach(comp => {
			this.setupItem(comp);
		});
	}

	protected getState() {
		return State.get().getItem(this.stateId!);
	}

	protected hasState() {
		return this.stateId && State.get().hasItem(this.stateId);
	}

	/**
	 * Restore state of the component in this function. It's called before render in init().
	 *
	 * @see saveState();
	 * @param state
	 *
	 * @protected
	 */
	protected restoreState(state: ComponentState) {

	}

	/**
	 * Call save start when something relevant to the state changes.
	 * Implement buildState() to save relevant state properties and restore it in restoreState()
	 *
	 * stateId must be set on components to be stateful
	 *
	 * @protected
	 */
	protected saveState() {
		if (this.stateId) {
			State.get().setItem(this.stateId, this.buildState());
		}
	}

	/**
	 * Build state for the component
	 *
	 * @see saveState();
	 * @protected
	 */
	protected buildState(): ComponentState {
		return {};
	}

	/**
	 * Get the DOM element
	 */
	public getEl() {
		if(!this.el) {
			throw new Error("Render first");
		}

		return this.el;
	}

	protected applyTitle() {
		this.el!.title = this.title!;
	}

	/**
	 * Set the title
	 *
	 * @param title
	 */
	public setTitle(title:string) {
		this.title = title;
		if (this.rendered) {
			this.applyTitle();
		}
	}

	/**
	 * Get the title of the compnent
	 */
	public getTitle() {
		return this.title;
	}

	/**
	 * Check if the component has been rendered and added to the DOM tree
	 */
	public isRendered() {
		return this.rendered;
	}

	/**
	 * Creates the DOM element of this component
	 *
	 * @protected
	 */
	protected internalRender() {
		this.el = document.createElement(this.tagName);

		if (this.baseCls) {
			this.el.className += this.baseCls;
		}

		if (this.cls) {
			this.el.className += this.baseCls ? " " + this.cls : this.cls;
		}

		this.applyHidden();

		if (this.disabled) {
			this.applyDisabled();
		}

		if (this.html) {
			this.applyHtml();
		}

		if (this.text) {
			this.applyText();
		}

		if (this.id) {
			this.applyId();
		}

		if (this.style) {
			Object.assign(this.el.style, this.style);
		}

		if (this.width) {
			this.el.style.width = this.width + "px";
		}

		if (this.height) {
			this.el.style.height = this.height + "px";
		}

		if (this.top) {
			this.el.style.top = this.top + "px";
		}

		if (this.left) {
			this.el.style.left = this.left + "px";
		}

		if (this.resizable) {
			this.el.classList.add("resizable");
		}

		if (this.flex) {
			this.el.style.flex = this.flex + "";
		}

		if(this.title) {
			this.applyTitle();
		}

		if(this.tabIndex != undefined) {
			this.el.tabIndex = this.tabIndex;
		}

		this.renderItems();

		return this.el;
	}

	/**
	 * Renders the component
	 *
	 * @param Component Node
	 * @param refChild Node
	 */
	public render(Component: Node, refChild?:Node|null ) {
		if(this.rendered) {
			throw new Error("Already rendered");
		}

		// if(!this.initCalled) {
		// 	throw new Error("Please don't construct a component with 'new Component' but use Component.create();");
		// }

		this.fire("beforerender", this);

		this.internalRender();

		this.fire("beforedom", this);
		if(!refChild) {
			Component.appendChild(this.getEl());
		} else
		{
			Component.insertBefore(this.getEl(), refChild);
		}

		this.rendered = true;

		this.fire("render", this);

		return this.getEl();
	}

	/**
	 * Remove component from the component tree
	 */
	public remove() {
		if(!this.fire("beforeremove", this)) {
			return false;
		}

		this.internalRemove();

		this.fire("remove", this);

		return true;
	}

	protected internalRemove() {
		this.getItems().clear();

		// remove this item from the Component
		if(this.parent) {
			this.parent.getItems().remove(this);
		}

		//remove it from the DOM
		if (this.el) {
			this.el.remove();
		}
	}

	protected applyHidden() {
		this.el!.hidden = this.hidden;
	}

	/**
	 * Set visibility state
	 *
	 * @param hidden
	 */
	public setHidden(hidden:boolean) {
		if(hidden) {
			this.hide();
		} else
		{
			this.show();
		}
	}

	/**
	 * Hide this component
	 *
	 * This sets the "hidden" attribute on the DOM element which set's CSS display:none.
	 * You can change this to fade with css class "fade-in" and "fade-out"
	 */
	public hide() {
		// noinspection PointlessBooleanExpressionJS
		if(this.fire("beforehide", this) === false) {
			return false;
		}
		this.internalHide();

		this.fire("hide", this);
		return true;
	}

	protected internalHide() {
		this.hidden = true;
		if (this.rendered) {
			this.applyHidden();
		}
	}

	/**
	 * Show the compenent
	 */
	public show() {
		// noinspection PointlessBooleanExpressionJS
		if(this.fire("beforeshow", this) === false) {
			return false;
		}
		this.internalShow();
		this.fire("show", this);
		return true;
	}

	protected internalShow() {
		this.hidden = false;
		if (this.rendered) {
			this.applyHidden();
		}
	}

	/**
	 * Check if this component is hidden
	 */
	public isHidden() {
		return this.el ? this.el.hidden : this.hidden;
	}

	protected applyDisabled() {
		if (!this.disabled) {
			this.el!.removeAttribute("disabled");
		} else {
			this.el!.setAttribute("disabled", "");
		}
	}

	/**
	 * Set disabled state
	 *
	 * Set's the "disabled" attribute on the DOM element
	 */
	public setDisabled(disabled:boolean) {
		this.disabled = disabled;
		if (this.rendered) {
			this.applyDisabled();
		}
	}

	/**
	 * Check if the component is disabled
	 */
	public isDisabled() {
		return this.el ? this.el.hasAttribute('disabled') : this.disabled;
	}

	protected applyHtml() {
		this.el!.innerHTML = this.html!;
	}

	/**
	 * Set the HTML contents
	 *
	 * @param html
	 */
	public setHtml(html:string) {
		this.html = html;
		if (this.rendered) {
			this.applyHtml()
		}
	}

	/**
	 * Get the HTML contents
	 */
	public getText() {
		return this.el ? this.el.innerText : this.text;
	}


	protected applyText() {
		this.el!.innerText = this.text!;
	}

	/**
	 * Set the HTML contents
	 *
	 * @param text
	 */
	public setText(text:string) {
		this.text = text;
		if (this.rendered) {
			this.applyText()
		}
	}

	/**
	 * Get the HTML contents
	 */
	public getHtml() {
		return this.el ? this.el.innerHTML : this.html;
	}

	/**
	 * Set the width in pixels
	 *
	 * @param width
	 */
	public setWidth(width:number) {
		this.width = width;
		if (this.rendered) {
			this.el!.style.width = width +"px";
		}
	}

	/**
	 * Get width in pixels
	 */
	public getWidth() {
		return this.el ? this.el.offsetWidth : (this.width || 0);
	}

	/**
	 * Set height in pixels
	 *
	 * @param height
	 */
	public setHeight(height:number) {
		this.height = height;
		if (this.rendered) {
			this.el!.style.height = height + "px";
		}
	}

	/**
	 * Get height in pixels
	 */
	public getHeight() {
		return this.el ? this.el.offsetHeight : (this.height || 0);
	}

	/**
	 * Set the top in pixels
	 *
	 * @param top
	 */
	public setTop(top:number) {
		this.top = top;
		if (this.rendered) {
			this.el!.style.top = top +"px";
		}
	}

	/**
	 * Get top in pixels
	 */
	public getTop() {
		return this.el ? this.el.offsetTop : this.top;
	}


	/**
	 * Set the top in pixels
	 *
	 * @param left
	 */
	public setLeft(left:number) {
		this.left = left;
		if (this.rendered) {
			this.el!.style.left = left +"px";
		}
	}

	/**
	 * Get left in pixels
	 */
	public getLeft() {
		return this.el ? this.el.offsetLeft : this.left;
	}



	protected applyId() {
		this.el!.id = this.id!;
	}

	/**
	 * Set id of the DOM element
	 *
	 * @param id
	 */
	public setId(id: string) {
		this.id = id;

		if (this.rendered) {
			this.applyId();
		}
	}

	/**
	 * Get DOM element ID
	 */
	public getId() {
		return this.el ? this.el.id : this.id;
	}

	/**
	 * Get the style object
	 */
	public getStyle(): CSSStyleDeclaration {
		if (!this.el) {
			if(!this.style) {
				this.style = {};
			}
			return <CSSStyleDeclaration> this.style;
		}
		return this.el.style

	}

	/**
	 * Focus the component
	 *
	 * @param o
	 */
	public focus(o?: FocusOptions) {
		// setTimeout needed for chrome :(
		setTimeout(() => {
			if (!this.el) {
				return;
			}
			this.el.focus(o);

			this.fire("focus", this, o);
		});
	}

	/**
	 * Find ancestor
	 *
	 * The method traverses the Component's ancestors (heading toward the document root) until it finds
	 * one where the given function returns true.
	 *
	 * @param fn When the function returns true the item will be returned. Otherwise it will move up to the next parent.
	 */
	public findAncestor(fn:(Component:Component) => void|boolean) : Component | undefined {
		let p = this.parent;
		while(p != undefined) {
			if (fn(p)) {
				return p;
			} else
			{
				p = p.parent;
			}
		}

		return undefined;
	}

	/**
	 * Find parent by instance type of the parent
	 *
	 * @example
	 * ```
	 * const form = textField.findAncestorByInstanceType(Form);
	 * ```
	 * @param cls
	 */
	public findAncestorByInstanceType<T extends typeof Component>(cls: T) : InstanceType<T> | undefined {
		const p = this.findAncestor(Component => Component instanceof cls);
		if(p) {
			return <InstanceType<T>> p;
		} else
		{
			return undefined;
		}
	}

	private setupItem(item:Component) {
		item.parent = this;
	}


	/**
	 * Get all items
	 */
	public getItems() {
		if(!this.items) {
			this.items = new Collection<Component>();
			this.initItems();
		}
		return this.items;
	}


	protected renderItems() {
		this.getItems().forEach((item) => {
			this.renderItem(item);
		});
	}

	/**
	 * Renders a Component item
	 * @param item
	 * @param refItem
	 * @protected
	 */
	protected renderItem(item: Component, refItem?: Component) {
		item.render(this.getEl(), refItem && refItem.isRendered() ? refItem.getEl() : undefined);
	}

	/**
	 * Find the item by element ID, itemId property, Component instance or custom function
	 */
	public findItemIndex(predicate: findPredicate): number {
		let fn = this.getFindPredicate(predicate);
		return this.getItems().findIndex(fn);
	}

	/**
	 * Find the item by element ID, itemId property, Component instance or custom function.
	 *
	 * If you want to search the component tree hierarchy use {@see findChild()}
	 *
	 */
	public findItem(predicate: findPredicate) : Component | undefined{
		let fn = this.getFindPredicate(predicate);
		return this.getItems().find(fn);
	}

	/**
	 * Cascade down the component hierarchy
	 *
	 * @param fn When the function returns false then the cascading will be stopped. The current Component will be finished!
	 */
	public cascade(fn: (comp: Component) => boolean | void) {
		if (fn(this) === false) {
			return this;
		}
		if(this.items) {
			for (let cmp of this.items) {
				cmp.cascade(fn);
			}
		}

		return this;
	}

	private getFindPredicate(predicate: findPredicate) :  (comp: Component) => boolean | void {
		if(predicate instanceof Function) {
			return predicate;
		} else
		{
			return (item: Component) => {
				return item === predicate || item.itemId === predicate || item.getId() === predicate;
			}
		}
	}

	/**
	 * Find a child by element ID, itemId property, Component instance or custom function.
	 *
	 * It cascades down the component hierarchy.
	 *
	 */
	public findChild(predicate: findPredicate): Component | undefined {
		let fn = this.getFindPredicate(predicate);

		let child;
		this.cascade((item: any) => {
			if(fn(item)) {
				child = item;
				return false;
			}
		});

		return child;
	}


	/**
	 * Mask the component to disable user interaction
	 * It creates an absolute positioned Mask
	 * component. This component should have a non-static position style for this to work.
	 */
	public mask() {
		if (!this._mask) {
			this._mask = Mask.create();
			this.getItems().add(this._mask);
		} else
		{
			this._mask.show();
		}
	}

	/**
	 * Unmask the body
	 */
	public unmask() {
		if(this._mask) {
			this._mask.hide();
		}
	}


}



export interface MaskConfig<T extends Observable> extends ComponentConfig<T> {
	/**
	 * Show loading spinner
	 */
	spinner?: boolean
}

/**
 * Mask element
 *
 * Shows a mask over the entire (position:relative) element it's in.
 *
 * Used in {@see Body.mask()}
 */
export class Mask extends Component {

	baseCls = "mask"

	spinner = true

	public static create<T extends typeof Observable>(this: T, config?: MaskConfig<InstanceType<T>>) {
		return <InstanceType<T>> super.create(<any> config);
	}

	protected init() {
		super.init();

		if (this.spinner) {
			this.html = '<div class="spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
		}
	}

}
