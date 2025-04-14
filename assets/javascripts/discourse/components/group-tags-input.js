import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { action } from "@ember/object";

export default class GroupTagsInputComponent extends Component {
  @tracked tags = A([]);
  @tracked newTag = "";

  constructor() {
    super(...arguments);

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
      console.log('converted', model);
    } else {
      if (!model.custom_fields) model.custom_fields = {};
      model.custom_fields.group_custom_tags = JSON.stringify(this.tags.toArray());
      console.log('no func', model)
    }
  }

}
