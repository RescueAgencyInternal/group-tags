import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
export default class GroupTagsInputComponent extends Component {
  @tracked tags = A([]);
  @tracked newTag = "";
  @tracked allTags = [];

  constructor() {
    super(...arguments);

    this.loadAvailableTags();

    const customTags =
      this.args.model?.custom_fields?.group_custom_tags ||
      this.args.group?.custom_fields?.group_custom_tags ||
      [];

    let parsed = [];

    if (typeof customTags === "string") {
      try {
        parsed = JSON.parse(customTags);
      } catch {
        parsed = [];
      }
    } else if (Array.isArray(customTags)) {
      parsed = customTags;
    }

    this.tags = A(parsed.slice());
  }

  async loadAvailableTags() {
    try {
      const allTags = await ajax("/group-tags/all.json");
      this.allTags = allTags;
    } catch (e) {
      console.error("Error fetching group tags:", e);
      this.allTags = [];
    }
  }

  @action
  handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      this.addTag();
    }
  }

  @action
  addTag() {
    let tag = this.newTag?.trim().replace(/[^0-9A-Za-z ]/g, "");
    if (!tag || this.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
      this.newTag = "";
      return;
    }

    this.tags = A([...this.tags, tag]);
    this.newTag = "";

    this._syncCustomFields();
  }

  @action
  addExistingTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags = A([...this.tags, tag]);
      this._syncCustomFields();
    }
  }

  @action
  removeTag(tag) {
    this.tags = A(this.tags.filter(t => t !== tag));
    this._syncCustomFields();
  }

  _syncCustomFields() {
    const model = this.args.model || this.args.group;

    if (typeof model.setCustomFields === "function") {
      model.setCustomFields({
        group_custom_tags: JSON.stringify(this.tags),
      });
    } else {
      if (!model.custom_fields) model.custom_fields = {};
      model.custom_fields.group_custom_tags = JSON.stringify(this.tags.toArray());
    }
  }

}
