/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {TextField} from "./TextField.js";
import {Config, Listener, ObservableEventMap, ObservableListenerOpts} from "../Observable.js";
import {FunctionUtil} from "../../util/FunctionUtil.js";
import {FieldEventMap} from "./Field.js";
import {btn, Button} from "../Button.js";
import {Component, createComponent} from "../Component.js";
import {List, listStoreType} from "../List";
import {listpicker} from "../picker";
import {Menu, menu} from "../menu";
import {storeRecordType} from "../../data";

export interface AutocompleteEventMap<Type> extends FieldEventMap<Type> {
	/**
	 * Fires when suggestions need to load
	 *
	 * @param form
	 */
	autocomplete: (field: Type, input: string) => any
	/**
	 * Fires when an item is selected from the list
	 */
	select: (field: Type, record: any) => any
}

export interface AutocompleteField<T extends List = List> extends TextField {
	on<K extends keyof AutocompleteEventMap<this>, L extends Listener>(eventName: K, listener: Partial<AutocompleteEventMap<this>>[K], options?: ObservableListenerOpts): L
	un<K extends keyof AutocompleteEventMap<this>>(eventName: K, listener: Partial<AutocompleteEventMap<this>>[K]): boolean
	fire<K extends keyof AutocompleteEventMap<this>>(eventName: K, ...args: Parameters<AutocompleteEventMap<Component>[K]>): boolean
}

/**
 * Autocomplete field
 */
export class AutocompleteField<T extends List = List> extends TextField {


	public readonly menu: Menu;
	protected readonly menuButton: Button;
	public readonly picker;
	public minLength = 0;

	/**
	 *
	 * @param list The table to use for suggestions
	 * @param buffer Buffer typing in the input in ms
	 */
	constructor(readonly list: T, private buffer = 300) {
		super();

		this.autocomplete = "off";
		this.baseCls += " autocomplete";

		this.picker = listpicker({
			list: list
		});

		this.picker.on("select", (tablePicker, record) => {

			tablePicker.list.findAncestorByType(Menu)!.hide();
			this.focus();

			//set value after focus for change event
			this.value = this.pickerRecordToValue(this, record);

			this.fire('select', this, record);
		});

		this.menu = menu({
				height: 300,
				cls: "scroll",
				listeners: {
					hide: (menu) => {
						if(menu.rendered) {
							const textfield = menu.findAncestorByType(TextField)!;
							textfield.focus();
						}
					}
				}
			},
			this.picker
		);

		this.menuButton = btn({
			icon: "expand_more",
			type: "button",
			handler: () => {
				this.fire("autocomplete", this, "");
			},
			menu: this.menu
		});
	}

	/**
	 * Method that transforms a record from the TablePicker store to a value for this field.
	 * This is not necessarily a text value. In conjunction with {@see valueToTextField()} this
	 * could also be an ID of an object for example.
	 *
	 * @param field
	 * @param record
	 */
	public pickerRecordToValue (field: this, record:storeRecordType<listStoreType<T>>) : any {
		return record.id;
	}

	/**
	 * This method transforms the value in to a text representation for the input field
	 *
	 * @param field
	 * @param value
	 */
	public async valueToTextField(field: this, value:any) {
		return "";
	}


	protected internalSetValue(v?: string) {

		if(v == undefined) {
			return super.internalSetValue(v);
		}

		this.valueToTextField(this, v+"").then(v => {

			if(this.input) {
				super.internalSetValue(v);
			} else {
				this.on("render", () => {
					super.internalSetValue(v);
				}, {once: true})
			}
		})
	}

	get value(): any {
		return this._value;
	}

	set value(v: any) {
		super.value = v;
	}

	protected internalRender(): HTMLElement {

		this.buttons = this.buttons || [];
		this.buttons.push(this.menuButton);

		const el = super.internalRender();

		this.menu.alignTo = this.wrap;
		this.menu.alignToInheritWidth = true;

		this.input!.addEventListener('input', FunctionUtil.buffer(this.buffer, this.onInput.bind(this)))

		this.input!.addEventListener('keydown', (ev) => {

			switch ((ev as KeyboardEvent).key) {

				case 'Enter':
					if(!this.menu.hidden) {
						ev.preventDefault();
						this.picker.onSelect();
					}
					break;

				case 'ArrowDown':
					ev.preventDefault();
					this.fire("autocomplete", this, this.input!.value);
					this.menuButton.showMenu();
					this.list.focus();
					break;

				case 'Escape':
					if (!this.menu.hidden) {
						this.menu.hide();
						ev.preventDefault();
						ev.stopPropagation();
						this.focus();
					}
					break;
			}
		});

		return el;
	}

	private onInput(ev: KeyboardEvent) {
		if(this.input!.value.length <= this.minLength) {
			return;
		}
		this.menuButton.showMenu();
		this.fire("autocomplete", this, this.input!.value);
	}

}

type AutoCompleteConfig<T extends List, Map extends ObservableEventMap<any>, Required extends keyof AutocompleteField<T>> = Config<AutocompleteField<T>, Map, Required> &
// Add the function properties as they are filtered out
	Partial<Pick<AutocompleteField<T>, "pickerRecordToValue" | "valueToTextField">>;



/**
 * Shorthand function to create an {@see AutocompleteField}
 *
 * @param config
 */
export const autocomplete = <T extends List> (config: AutoCompleteConfig<T, AutocompleteEventMap<AutocompleteField<T>>, "list">) => createComponent(new AutocompleteField(config.list), config);