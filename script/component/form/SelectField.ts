/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {FieldEventMap} from "./Field.js";
import {createComponent} from "../Component.js";
import {Store} from "../../data/index.js";
import {Config} from "../Observable";
import {InputField} from "./InputField";

/**
 * Select component option
 *
 * By default, it should have a "value" and "name" property. This can be changed with the {@link Select.valueField} and
 * {@link Select.textRenderer}.
 */
type SelectOption = { [key: string]: any };

export interface SelectField {
	get input(): HTMLSelectElement
}
/**
 * Select field
 *
 * @see Form
 */
export class SelectField extends InputField {

	public baseCls = "goui-form-field select no-floating-label";


	/**
	 * The field of the select options that is used as value
	 */
	public valueField = 'value';

	protected fireChangeOnBlur = false;

	/**
	 * Renderer function. Defaults to returning a 'name' property.
	 *
	 * @param record
	 */
	public textRenderer?: (record: { [key: string]: any }) => string = (record: { [key: string]: any }) => record.name;
	private _store?: Store;
	private _options?: SelectOption[];

	protected createInput() {
		return document.createElement("select")
			.on('change', _ => this.fireChange());
	}

	// turned off fireChangeOnBlur but override onFocusIn() to get the oldValue
	protected onFocusIn(e:FocusEvent) {
		this.captureValueForChange();
	}
	/**
	 * Redraw the options. Can be useful when this.textRenderer() produces another result
	 */
	public drawOptions() {
		this.options = this.options;
	}

	protected internalRender() {
		if(this._store)
			this.options = this._store.items;
		return super.internalRender();
	}

	/**
	 * Provide select input with options
	 *
	 * It should have at least have a field that corresponds with {@link Select.valueField}
	 *
	 * By default, it should have a "value" and "name" property. This can be changed with the {@link Select.valueField} and
	 * {@link Select.textRenderer}.
	 *
	 * @param opts
	 */
	public set options(opts:SelectOption[]) {

		const v = this._value as any;

		this._options = opts;
		this.input!.empty();
		opts.forEach((o: any) => {
			this.input!.append(new Option(this.textRenderer!(o), o[this.valueField]??undefined));
		});

		this.internalSetValue(v);
	}

	public get options() {
		return this._options ?? [];
	}

	/**
	 * A store to provide the {@link Select.options}.
	 * @param store
	 */
	public set store(store: Store) {
		this._store = store;
		store.on("datachanged", () => this.options = store.items);
	}

	public get store(): Store|undefined {
		return this._store;
	}

	set value(v: string|undefined) {
		super.value = v;
	}

	get value() : string | undefined {

		if(!this.rendered) {
			return this._value as any;
		}
		const opts = (this.store ? this.store.items : this.options);

		let index = this.input!.selectedIndex;

		let v;
		if(opts[index]) {
			v = opts[index][this.valueField]
		} else {
			v = undefined;
		}
		return v;
	}
}

/**
 * Shorthand function to create {@see SelectField}
 *
 * @param config
 */
export const select = (config?: Config<SelectField, FieldEventMap<SelectField>>) => createComponent(new SelectField(), config);