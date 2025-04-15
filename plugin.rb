# name: group-tags
# about: Adds custom tags to groups and stores them as a serialized string in group_custom_fields
# version: 0.1
# authors: Andrew De Forest

register_asset "stylesheets/common/group-tags.scss"

after_initialize do
  # Store as JSON string before saving
  Group.class_eval do
    before_save do
      tags = self.custom_fields["group_custom_tags"]

      if tags.is_a?(Array)
        normalized = tags.map { |t| t.strip.downcase }.uniq
        self.custom_fields["group_custom_tags"] = normalized.to_json
      end
    end
  end

  # Deserialize tags when presenting in serializer
  add_to_serializer(:group_show, :group_custom_tags) do
    raw = object.custom_fields["group_custom_tags"]
    begin
      JSON.parse(raw)
    rescue
      []
    end
  end

  add_to_serializer(:group_show, :include_group_custom_tags?) do
    object.custom_fields["group_custom_tags"].present?
  end

  # Permit custom_fields in the group form
  register_editable_group_custom_field :group_custom_tags

  # Route and controller must go INSIDE after_initialize
  Discourse::Application.routes.append do
    get "/group-tags/all.json", to: ::DiscourseGroupTagsController.action(:all)
  end

  class ::DiscourseGroupTagsController < ::ApplicationController
    requires_plugin ::Plugin::Instance

    def all
      tags = GroupCustomField
        .where(name: "group_custom_tags")
        .pluck(:value)
        .flat_map do |json|
          begin
            JSON.parse(json)
          rescue JSON::ParserError
            []
          end
        end

      render json: tags.uniq.compact.reject(&:blank?).sort
    end
  end
end
