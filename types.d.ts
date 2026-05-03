declare module "@base-ui/react" {
  export const Button: React.ComponentType<any>
}

declare module "@base-ui/react/avatar" {
  export namespace Avatar {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Image {
      export interface Props extends React.ComponentProps<"img"> {}
    }
    export namespace Fallback {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Avatar: {
    Root: React.ComponentType<Avatar.Root.Props>
    Image: React.ComponentType<Avatar.Image.Props>
    Fallback: React.ComponentType<Avatar.Fallback.Props>
  }
}

declare module "@base-ui/react/select" {
  export namespace Select {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {
        defaultValue?: string
        onValueChange?: (value: string) => void
      }
    }
    export namespace Trigger {
      export interface Props extends React.ComponentProps<"button"> {}
    }
    export namespace Content {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Group {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Item {
      export interface Props extends React.ComponentProps<"option"> {}
    }
    export namespace Value {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Icon {
      export interface Props extends React.ComponentProps<"div"> {
        render?: React.ReactElement
      }
    }
    export namespace Portal {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Positioner {
      export interface Props extends React.ComponentProps<"div"> {
        align?: "start" | "center" | "end"
        alignOffset?: number
        side?: "top" | "bottom" | "left" | "right"
        sideOffset?: number
        alignItemWithTrigger?: boolean
      }
    }
    export namespace Popup {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace List {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace GroupLabel {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace ItemText {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace ItemIndicator {
      export interface Props extends React.ComponentProps<"div"> {
        render?: React.ReactElement
      }
    }
    export namespace Separator {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace ScrollUpArrow {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace ScrollDownArrow {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Select: {
    Root: React.ComponentType<Select.Root.Props>
    Trigger: React.ComponentType<Select.Trigger.Props>
    Content: React.ComponentType<Select.Content.Props>
    Group: React.ComponentType<Select.Group.Props>
    Item: React.ComponentType<Select.Item.Props>
    Value: React.ComponentType<Select.Value.Props>
    Icon: React.ComponentType<Select.Icon.Props>
    Portal: React.ComponentType<Select.Portal.Props>
    Positioner: React.ComponentType<Select.Positioner.Props>
    Popup: React.ComponentType<Select.Popup.Props>
    List: React.ComponentType<Select.List.Props>
    GroupLabel: React.ComponentType<Select.GroupLabel.Props>
    ItemText: React.ComponentType<Select.ItemText.Props>
    ItemIndicator: React.ComponentType<Select.ItemIndicator.Props>
    Separator: React.ComponentType<Select.Separator.Props>
    ScrollUpArrow: React.ComponentType<Select.ScrollUpArrow.Props>
    ScrollDownArrow: React.ComponentType<Select.ScrollDownArrow.Props>
  }
}

declare module "@base-ui/react/dialog" {
  export namespace Dialog {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {
        open?: boolean
        onOpenChange?: (open: boolean) => void
      }
    }
    export namespace Trigger {
      export interface Props extends React.ComponentProps<"button"> {}
    }
    export namespace Popup {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Title {
      export interface Props extends React.ComponentProps<"h2"> {}
    }
    export namespace Description {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Close {
      export interface Props extends React.ComponentProps<"button"> {
        render?: React.ReactElement
      }
    }
    export namespace Backdrop {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Portal {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Dialog: {
    Root: React.ComponentType<Dialog.Root.Props>
    Trigger: React.ComponentType<Dialog.Trigger.Props>
    Popup: React.ComponentType<Dialog.Popup.Props>
    Title: React.ComponentType<Dialog.Title.Props>
    Description: React.ComponentType<Dialog.Description.Props>
    Close: React.ComponentType<Dialog.Close.Props>
    Backdrop: React.ComponentType<Dialog.Backdrop.Props>
    Portal: React.ComponentType<Dialog.Portal.Props>
  }
}

declare module "@base-ui/react/checkbox" {
  export namespace Checkbox {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Indicator {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Checkbox: {
    Root: React.ComponentType<Checkbox.Root.Props>
    Indicator: React.ComponentType<Checkbox.Indicator.Props>
  }
}

declare module "@base-ui/react/merge-props" {
  export function mergeProps<T extends React.ElementType>(
    ...args: any[]
  ): React.ComponentProps<T>
}

declare module "@base-ui/react/use-render" {
  export namespace useRender {
    export type ComponentProps<T extends React.ElementType> = React.ComponentProps<T> & {
      render?: React.ReactElement
    }
  }
  export function useRender(options: any): any
}

declare module "@base-ui/react/input" {
  export namespace Input {
    export interface Props extends React.ComponentProps<"input"> {}
  }
  export const Input: React.ComponentType<Input.Props>
}

declare module "@base-ui/react/button" {
  export namespace Button {
    export interface Props extends React.ComponentProps<"button"> {
      nativeButton?: boolean
      render?: React.ReactElement
    }
  }
  export const Button: React.ComponentType<Button.Props>
}

declare module "@base-ui/react/tooltip" {
  export namespace Tooltip {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Trigger {
      export interface Props extends React.ComponentProps<"button"> {
        render?: React.ReactElement
      }
    }
    export namespace Popup {
      export interface Props extends React.ComponentProps<"div"> {
        children?: React.ReactNode
      }
    }
    export namespace Portal {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Positioner {
      export interface Props extends React.ComponentProps<"div"> {
        align?: "start" | "center" | "end"
        alignOffset?: number
        side?: "top" | "bottom" | "left" | "right"
        sideOffset?: number
      }
    }
    export namespace Provider {
      export interface Props extends React.ComponentProps<"div"> {
        delay?: number
      }
    }
    export namespace Arrow {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Tooltip: {
    Root: React.ComponentType<Tooltip.Root.Props>
    Trigger: React.ComponentType<Tooltip.Trigger.Props>
    Popup: React.ComponentType<Tooltip.Popup.Props>
    Portal: React.ComponentType<Tooltip.Portal.Props>
    Positioner: React.ComponentType<Tooltip.Positioner.Props>
    Provider: React.ComponentType<Tooltip.Provider.Props>
    Arrow: React.ComponentType<Tooltip.Arrow.Props>
  }
}

declare module "@base-ui/react/menu" {
  export namespace Menu {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Trigger {
      export interface Props extends React.ComponentProps<"button"> {
        render?: React.ReactElement
      }
    }
    export namespace Popup {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Positioner {
      export interface Props extends React.ComponentProps<"div"> {
        align?: string
        alignOffset?: number
        side?: string
        sideOffset?: number
      }
    }
    export namespace Item {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Group {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace GroupLabel {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Portal {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace SubmenuRoot {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace SubmenuTrigger {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace SubmenuPopup {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Checkbox {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace CheckboxItem {
      export interface Props extends React.ComponentProps<"div"> {
        checked?: boolean
        onCheckedChange?: (checked: boolean) => void
      }
    }
    export namespace CheckboxItemIndicator {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace RadioGroup {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace RadioItem {
      export interface Props extends React.ComponentProps<"div"> {
        value?: string
      }
    }
    export namespace RadioItemIndicator {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Separator {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Menu: {
    Root: React.ComponentType<Menu.Root.Props>
    Trigger: React.ComponentType<Menu.Trigger.Props>
    Popup: React.ComponentType<Menu.Popup.Props>
    Positioner: React.ComponentType<Menu.Positioner.Props>
    Item: React.ComponentType<Menu.Item.Props>
    Group: React.ComponentType<Menu.Group.Props>
    GroupLabel: React.ComponentType<Menu.GroupLabel.Props>
    Portal: React.ComponentType<Menu.Portal.Props>
    SubmenuRoot: React.ComponentType<Menu.SubmenuRoot.Props>
    SubmenuTrigger: React.ComponentType<Menu.SubmenuTrigger.Props>
    SubmenuPopup: React.ComponentType<Menu.SubmenuPopup.Props>
    Checkbox: React.ComponentType<Menu.Checkbox.Props>
    CheckboxItem: React.ComponentType<Menu.CheckboxItem.Props>
    CheckboxItemIndicator: React.ComponentType<Menu.CheckboxItemIndicator.Props>
    RadioGroup: React.ComponentType<Menu.RadioGroup.Props>
    RadioItem: React.ComponentType<Menu.RadioItem.Props>
    RadioItemIndicator: React.ComponentType<Menu.RadioItemIndicator.Props>
    Separator: React.ComponentType<Menu.Separator.Props>
  }
}

declare module "@base-ui/react/tabs" {
  export namespace Tabs {
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {
        orientation?: "horizontal" | "vertical"
      }
    }
    export namespace List {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Tab {
      export interface Props extends React.ComponentProps<"button"> {}
    }
    export namespace Panel {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Indicator {
      export interface Props extends React.ComponentProps<"div"> {}
    }
  }
  export const Tabs: {
    Root: React.ComponentType<Tabs.Root.Props>
    List: React.ComponentType<Tabs.List.Props>
    Tab: React.ComponentType<Tabs.Tab.Props>
    Panel: React.ComponentType<Tabs.Panel.Props>
    Indicator: React.ComponentType<Tabs.Indicator.Props>
  }
}

declare module "@base-ui/react/toggle" {
  export interface ToggleProps extends React.ComponentProps<"button"> {}
  export namespace Toggle {
    export interface Props extends React.ComponentProps<"button"> {}
    export namespace Root {
      export interface Props extends React.ComponentProps<"button"> {}
    }
  }
  export const Toggle: React.ComponentType<ToggleProps>
}

declare module "@base-ui/react/toggle-group" {
  export interface ToggleGroupProps extends React.ComponentProps<"div"> {}
  export namespace ToggleGroup {
    export interface Props extends React.ComponentProps<"div"> {}
    export namespace Root {
      export interface Props extends React.ComponentProps<"div"> {}
    }
    export namespace Item {
      export interface Props extends React.ComponentProps<"button"> {}
    }
  }
  export const ToggleGroup: React.ComponentType<ToggleGroupProps>
}

declare module "@base-ui/react/separator" {
  export interface SeparatorProps extends React.ComponentProps<"hr"> {
    orientation?: "horizontal" | "vertical"
  }
  export namespace Separator {
    export interface Props extends React.ComponentProps<"hr"> {
      orientation?: "horizontal" | "vertical"
    }
    export namespace Root {
      export interface Props extends React.ComponentProps<"hr"> {}
    }
  }
  export const Separator: React.ComponentType<SeparatorProps>
}
