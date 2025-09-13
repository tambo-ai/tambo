import { defineComponent, h, onMounted, ref, watch } from "vue";
import { z } from "zod";
import { useTamboInteractable } from "./tambo-interactable-provider";

export interface InteractableConfig {
  componentName: string;
  description: string;
  propsSchema?: z.ZodTypeAny;
}

export interface WithTamboInteractableProps {
  interactableId?: string;
  onInteractableReady?: (id: string) => void;
  onPropsUpdate?: (newProps: Record<string, any>) => void;
}

export function withTamboInteractable<P extends Record<string, any>>(
  WrappedComponent: any,
  config: InteractableConfig,
) {
  return defineComponent<P & WithTamboInteractableProps>({
    name: `withTamboInteractable(${WrappedComponent.name || "Component"})`,
    props: {} as any,
    setup(props, { attrs, slots }) {
      const {
        addInteractableComponent,
        updateInteractableComponentProps,
        getInteractableComponent,
      } = useTamboInteractable();

      const interactableId = ref<string | null>(null);
      const isInitialized = ref(false);
      const lastParentProps = ref<Record<string, any>>({});

      const registerComponent = () => {
        if (!isInitialized.value) {
          const id = addInteractableComponent({
            name: config.componentName,
            description: config.description,
            component: WrappedComponent,
            props: { ...(attrs as any) },
            propsSchema: config.propsSchema,
          });
          interactableId.value = id;
          (props as any).onInteractableReady?.(id);
          isInitialized.value = true;
        }
      };

      onMounted(() => {
        registerComponent();
      });

      watch(
        () => ({ ...(attrs as any) }),
        (componentProps) => {
          if (interactableId.value && isInitialized.value) {
            const lastPropsString = JSON.stringify(lastParentProps.value);
            const currentPropsString = JSON.stringify(componentProps);
            if (lastPropsString !== currentPropsString) {
              updateInteractableComponentProps(interactableId.value, componentProps);
              (props as any).onPropsUpdate?.(componentProps);
              lastParentProps.value = componentProps;
            }
          }
        },
        { deep: true },
      );

      return () => {
        const currentInteractable = interactableId.value
          ? getInteractableComponent(interactableId.value)
          : null;
        const effectiveProps = (currentInteractable?.props ?? attrs) as any;
        return h(WrappedComponent, effectiveProps, slots);
      };
    },
  });
}

