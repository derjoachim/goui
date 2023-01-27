import {Field} from "./Field.js";
import {Config, createComponent} from "../Component.js";
import {JmapStore} from "../../jmap/JmapStore.js";

/**
 * Select field
 *
 * @see Form
 */
export class SelectField extends Field {

	public baseCls = "goui-form-field select"

	protected input: HTMLSelectElement | undefined;

	public options: {[key:string]: any}[] = [];
	public store?: JmapStore

	public valueField = 'value';
	public textRenderer?: (record: {[key:string]: any})=> string = (record: {[key:string]: any}) => record.name;

	protected createControl(): undefined | HTMLElement {
		//grab value before creating this.input otherwise it will return the input value
		const v = this.value;

		this.input = document.createElement("select");
		this.input.name = this.name;
		if (this.required) {
			this.input.setAttribute("required", "");
		}

		this.drawOptions();

		this.input.addEventListener("change", () => {
			this.fireChange();
		});

		this.el.appendChild(this.input);

		return this.input;
	}

	getInput() {
		return this.input;
	}

	drawOptions() {
		if(!this.input) return;
		this.input.innerHTML = ''; // redraw
		(this.store ? this.store.items : this.options).forEach((o: any) => {
			const opt = new Option();
			if (o[this.valueField]) {
				opt.value = o[this.valueField];
			}
			opt.innerHTML = this.textRenderer!(o);

			this.input?.appendChild(opt);
		});
		if (this._value) {
			// for updating this.input.selectIndex
			this.value = this._value;
		}
	}

	set value(v: string) {

		if (this.input) {
			this.input.value = v;
		}

		super.value = v;
	}


	get value() {
		if (!this.input) {
			return super.value;
		} else {
			return this.input.value;
		}
	}


	set name(name: string) {
		super.name = (name);

		if (this.input) {
			this.input.name = this.name
		}
	}

	get name() {
		return super.name;
	}

	protected validate() {
		super.validate();

		//this implements the native browser validation
		if (!this.input!.validity.valid) {
			this.setInvalid(this.input!.validationMessage);
		}
	}


}

/**
 * Shorthand function to create {@see SelectField}
 *
 * @param config
 */
export const select = (config?: Config<SelectField>) => createComponent(new SelectField(), config);