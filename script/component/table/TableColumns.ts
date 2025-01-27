/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {Config, Observable} from "../Observable.js";
import {Table} from "./Table.js";
import {Component, createComponent} from "../Component.js";
import {Format, FunctionUtil} from "../../util";
import {checkbox} from "../form";
import {btn} from "../Button";
import {menu} from "../menu";

type TableColumnRenderer = (columnValue: any, record: any, td: HTMLTableCellElement, table: Table, storeIndex: number) => string | Promise<string> | Component | Promise<Component>;
type HeaderRenderer = (col: TableColumn, headerEl: HTMLTableCellElement, table: Table) => string | Component;

export type align = "left" | "right" | "center";

export class TableColumn extends Observable {


	public parent: Table | undefined;

	/**
	 *
	 * The column ID. Also used for 'property'
	 */
	constructor(public id: string) {
		super();

		this.property = id;
	}

	/**
	 * Path to property. If not given then 'id' is used
	 *
	 * @see ObjectUtil.path()
	 */
	public property: string

	/**
	 * Header in the table
	 */
	header?: string;

	/**
	 * Renderer function for the display
	 */
	renderer?: TableColumnRenderer


	/**
	 * Renderer function for the header
	 */
	headerRenderer?: HeaderRenderer

	/**
	 * Make the column resizable by the user
	 */
	resizable = false

	/**
	 * Make it sortable by the user
	 */
	sortable = false

	/**
	 * Width in pixels
	 */
	width?: number

	/**
	 * Text alignment
	 */
	align: align = "left"

	/**
	 * Hide the column. It can be enabled by the user via the context menu.
	 */
	hidden = false

	/**
	 * Enable this column in the enabled columns menu
	 */
	hidable = true

	/**
	 * When rendered this is set to the DOM element.
	 * It's used to update the header width
	 */
	headerEl?: HTMLTableCellElement;

	/**
	 * Add CSS classes
	 */
	cls?: string
}

type TableColumnConfig = Config<TableColumn> & {
	/**
	 * The ID of the column which is also the default for the column 'property'
	 */
	id: string
};
/**
 * Create a table column
 *
 * @param config
 */
export const column = (config: TableColumnConfig) => createComponent(new TableColumn(config.id), config);

export class DateTimeColumn extends TableColumn {
	renderer = (date: string) => {
		return Format.dateTime(date);
	}

	//argh!? https://stackoverflow.com/questions/43121661/typescript-type-inference-issue-with-string-literal
	align = "right" as align
	width = 190
}

/**
 * Create a column showing date and time
 * @param config
 */
export const datetimecolumn = (config: TableColumnConfig) => createComponent(new DateTimeColumn(config.id), config);

export class DateColumn extends TableColumn {
	renderer = (date: string) => {
		return Format.date(date);
	}

	//argh!? https://stackoverflow.com/questions/43121661/typescript-type-inference-issue-with-string-literal
	align = "right" as align
	width = 128
}

/**
 * Create a column showing just a date
 *
 * @param config
 */
export const datecolumn = (config: TableColumnConfig) => createComponent(new DateColumn(config.id), config);

export class CheckboxColumn extends TableColumn {
	constructor(id: string) {
		super(id);

		this.cls = "checkbox-select-column";

	}

	renderer = (val: boolean) => {
		return checkbox({
			value: val
		});
	}
}

/**
 * Create a checkbox column
 *
 * @param config
 */
export const checkboxcolumn = (config: TableColumnConfig) => createComponent(new CheckboxColumn(config.id), config);



export class CheckboxSelectColumn extends TableColumn {

	constructor(id = "checkboxselect") {
		super(id);
		this.hidable = false;

		this.cls = "checkbox-select-column";
	}

	headerRenderer: HeaderRenderer = (col, headerEl, table) => {

		return checkbox({
			listeners: {
				change: (field, newValue, oldValue) => {

					if (newValue) {
						table.rowSelection!.selectAll();
					} else {
						table.rowSelection!.clear();
					}

				}
			}
		});
	}

	renderer: TableColumnRenderer = (val: boolean, record, td, table, rowIndex) => {

		// add to selection model if value is true
		if(val && table.rowSelection) {
			table.rowSelection.add(rowIndex);
		}

		return checkbox({
			value: val,
			listeners: {
				render: (field) => {
					field.el.addEventListener("mousedown", (ev) => {
						ev.stopPropagation()
					});

					table.rowSelection!.on("selectionchange", () => {
						field.value = table.rowSelection!.selected.indexOf(rowIndex) > -1;
					});
				},
				change: (field, newValue, oldValue) => {
					const index = table.store.indexOf(record);
					if (newValue) {
						table.rowSelection!.add(index);
					} else {
						table.rowSelection!.remove(index);
					}

				}
			}
		});
	}
}

export const checkboxselectcolumn = (config?: TableColumnConfig) => createComponent(new CheckboxSelectColumn(config && config.id ? config.id : "checkboxselect"), config);


/**
 * Creates a menu button.
 *
 * All items will have a property dataSet.rowIndex and dataSet.table so you know which record has been clicked on.
 *
 * @param items
 */
export const menucolumn = (...items:Component[]) => column({
		width: 48,
		id: "btn",
		// headerRenderer: (col: TableColumn, headerEl: HTMLTableCellElement, table: Table) => {
		// 	headerEl.style.position = "sticky";
		// 	headerEl.style.right = "0";
		// 	return "";
		// },
		renderer: (columnValue: any, record, td, table, rowIndex) => {
			// td.style.position = "sticky";
			// td.style.right = "0";

			items.forEach(i => {
				i.dataSet.table = table;
				i.dataSet.rowIndex = rowIndex;
			});

			return btn({
				icon: "more_vert",
				menu: menu({}, ...items)
			})
		}
	});