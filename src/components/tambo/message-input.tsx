"use client";

import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import {
  McpPromptButton,
  McpResourceButton,
} from "@/components/tambo/mcp-components";
import { McpConfigModal } from "@/components/tambo/mcp-config-modal";
import {
  getMusicGenesByIds,
  musicGeneCategories,
  type MusicGeneWithCategory,
} from "@/lib/music-genes";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboContextAttachment,
  useTambo,
  useTamboThreadInput,
  type StagedImage,
} from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Paperclip,
  Plus,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import * as React from "react";
const DictationButton = dynamic(() => import("./dictation-button"), {
  ssr: false,
});

/**
 * CSS variants for the message input container
 * @typedef {Object} MessageInputVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling with border emphasis
 */
const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:bg-background",
        "[&>div]:border-0",
        "[&>div]:shadow-xl [&>div]:shadow-black/5 [&>div]:dark:shadow-black/20",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-lg",
      ].join(" "),
      bordered: [
        "[&>div]:bg-transparent",
        "[&>div]:border-2 [&>div]:border-border",
        "[&>div]:shadow-none",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:border-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * @typedef MessageInputContextValue
 * @property {string} value - The current input value
 * @property {function} setValue - Function to update the input value
 * @property {function} submit - Function to submit the message
 * @property {function} handleSubmit - Function to handle form submission
 * @property {boolean} isPending - Whether a submission is in progress
 * @property {Error|null} error - Any error from the submission
 * @property {string|undefined} userKey - The thread user key
 * @property {HTMLTextAreaElement|null} textareaRef - Reference to the textarea element
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
 */
interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: () => Promise<{ threadId: string | undefined }>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  userKey?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  elicitation: TamboElicitationRequest | null;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
  selectedMusicGeneIds: string[];
  selectedMusicGenes: MusicGeneWithCategory[];
  toggleMusicGene: (id: string) => void;
  clearMusicGenes: () => void;
}

/**
 * React Context for sharing message input data and functions among sub-components.
 * @internal
 */
const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * Throws an error if used outside of a MessageInput component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.
 * @internal
 */
const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};

const MUSIC_GENE_PROMPT_START = "\n\n[Music gene filter]\n";
const MUSIC_GENE_PROMPT_END = "\n[/Music gene filter]";

function stripMusicGenePrompt(value: string) {
  const start = value.indexOf(MUSIC_GENE_PROMPT_START);
  if (start === -1) return value;

  const end = value.indexOf(MUSIC_GENE_PROMPT_END, start);
  if (end === -1) {
    return value.slice(0, start).trimEnd();
  }

  return `${value.slice(0, start)}${value.slice(
    end + MUSIC_GENE_PROMPT_END.length,
  )}`.trimEnd();
}

function formatMusicGenePrompt(genes: MusicGeneWithCategory[]) {
  if (genes.length === 0) return "";

  const lines = genes.map(
    (gene) =>
      `- ${gene.name} (${gene.category}, ${gene.type}): ${gene.promptCue} Definition: ${gene.definition}. Effect: ${gene.effect}.`,
  );

  return `${MUSIC_GENE_PROMPT_START}Treat the selected items as modular prompt manuals for small-grain music control. Preserve the user's request, then bias the Strudel composition toward these music genes:\n${lines.join(
    "\n",
  )}${MUSIC_GENE_PROMPT_END}`;
}

function composeMessageWithMusicGenes(
  visibleMessage: string,
  genes: MusicGeneWithCategory[],
) {
  const cleanedMessage = stripMusicGenePrompt(visibleMessage).trimEnd();
  const genePrompt = formatMusicGenePrompt(genes);
  if (!genePrompt) return cleanedMessage;
  return `${cleanedMessage}${genePrompt}`;
}

function keepWheelInsideScrollablePanel(e: React.WheelEvent<HTMLDivElement>) {
  const element = e.currentTarget;
  if (element.scrollHeight <= element.clientHeight) return;

  e.stopPropagation();
}

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  /** The user key identifying which thread to send messages to. */
  userKey?: string;
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the textarea element. */
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput userKey="my-thread" variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, userKey, variant, ...props }, ref) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        userKey={userKey}
        variant={variant}
        {...props}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </MessageInputInternal>
    );
  },
);
MessageInput.displayName = "MessageInput";

/**
 * Internal MessageInput component that uses the TamboThreadInput context
 */
const MessageInputInternal = React.forwardRef<
  HTMLFormElement,
  MessageInputProps
>(({ children, className, userKey, variant, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    clearImages,
  } = useTamboThreadInput();
  const { cancelRun } = useTambo();
  const { clearContextAttachments } = useTamboContextAttachment();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedMusicGeneIds, setSelectedMusicGeneIds] = React.useState<
    string[]
  >([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const dragCounter = React.useRef(0);

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();
  const selectedMusicGenes = React.useMemo(
    () => getMusicGenesByIds(selectedMusicGeneIds),
    [selectedMusicGeneIds],
  );

  React.useEffect(() => {
    const visibleValue = stripMusicGenePrompt(value);
    setDisplayValue(visibleValue);
    if (visibleValue && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [value]);

  React.useEffect(() => {
    const nextValue = composeMessageWithMusicGenes(
      displayValue,
      selectedMusicGenes,
    );
    if (nextValue !== value) {
      setValue(nextValue);
    }
  }, [displayValue, selectedMusicGenes, setValue, value]);

  const toggleMusicGene = React.useCallback((id: string) => {
    setSelectedMusicGeneIds((current) =>
      current.includes(id)
        ? current.filter((geneId) => geneId !== id)
        : [...current, id],
    );
  }, []);

  const clearMusicGenes = React.useCallback(() => {
    setSelectedMusicGeneIds([]);
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      setSubmitError(null);
      setDisplayValue("");
      setIsSubmitting(true);

      // Clear images in next tick for immediate UI feedback
      if (images.length > 0) {
        setTimeout(() => clearImages(), 0);
      }

      try {
        await submit();
        setValue("");
        setSelectedMusicGeneIds([]);
        // Clear context attachments after successful submit
        clearContextAttachments();
        // Images are cleared automatically by the TamboThreadInputProvider
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      } catch (error) {
        console.error("Failed to submit message:", error);
        setDisplayValue(value);

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isThreadError = errorMessage.toLowerCase().includes("thread");

        setSubmitError(
          isThreadError
            ? "Thread error. Please try again or start a new thread."
            : errorMessage || "Failed to send message. Please try again.",
        );

        // Cancel the run to reset loading state
        await cancelRun();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      value,
      submit,
      setValue,
      setDisplayValue,
      setSubmitError,
      cancelRun,
      isSubmitting,
      images,
      clearImages,
      clearContextAttachments,
      setSelectedMusicGeneIds,
    ],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        try {
          await addImages(files);
        } catch (error) {
          console.error("Failed to add dropped images:", error);
        }
      }
    },
    [addImages],
  );

  const handleElicitationResponse = React.useCallback(
    (response: TamboElicitationResponse) => {
      // Calling resolveElicitation automatically clears the elicitation state
      if (resolveElicitation) {
        resolveElicitation(response);
      }
    },
    [resolveElicitation],
  );

  const contextValue = React.useMemo(
    () => ({
      value: displayValue,
      setValue: (newValue: string) => {
        setValue(composeMessageWithMusicGenes(newValue, selectedMusicGenes));
        setDisplayValue(newValue);
      },
      submit,
      handleSubmit,
      isPending: isPending ?? isSubmitting,
      error,
      userKey,
      textareaRef: inputRef ?? textareaRef,
      submitError,
      setSubmitError,
      elicitation,
      resolveElicitation,
      selectedMusicGeneIds,
      selectedMusicGenes,
      toggleMusicGene,
      clearMusicGenes,
    }),
    [
      displayValue,
      setValue,
      submit,
      handleSubmit,
      isPending,
      isSubmitting,
      error,
      userKey,
      inputRef,
      textareaRef,
      submitError,
      elicitation,
      resolveElicitation,
      selectedMusicGeneIds,
      selectedMusicGenes,
      toggleMusicGene,
      clearMusicGenes,
    ],
  );
  return (
    <MessageInputContext.Provider
      value={contextValue as MessageInputContextValue}
    >
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        data-slot="message-input-form"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        <div
          className={cn(
            "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
            isDragging
              ? "border border-dashed border-emerald-400"
              : "border border-border",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                Drop files here to add to conversation
              </p>
            </div>
          )}
          {elicitation ? (
            <ElicitationUI
              request={elicitation}
              onResponse={handleElicitationResponse}
            />
          ) : (
            <>
              <MessageInputContextAttachments />
              <MessageInputStagedImages />
              {children}
            </>
          )}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";
MessageInput.displayName = "MessageInput";

/**
 * Symbol for marking pasted images
 */
const IS_PASTED_IMAGE = Symbol("is-pasted-image");

/**
 * Extend the File interface to include IS_PASTED_IMAGE symbol
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Textarea component for entering message text.
 * Automatically connects to the context to handle value changes and key presses.
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea placeholder="Type your message..." />
 * </MessageInput>
 * ```
 */
const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, textareaRef, handleSubmit } =
    useMessageInputContext();
  const { isIdle } = useTambo();
  const { addImage } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        await handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));

    // Allow default paste if there is text, even when images exist
    const hasText = e.clipboardData.getData("text/plain").length > 0;

    if (imageItems.length === 0) {
      return; // Allow default text paste
    }

    if (!hasText) {
      e.preventDefault(); // Only prevent when image-only paste
    }

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        try {
          // Mark this file as pasted so we can show "Image 1", "Image 2", etc.
          file[IS_PASTED_IMAGE] = true;
          await addImage(file);
        } catch (error) {
          console.error("Failed to add pasted image:", error);
        }
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/60",
        className,
      )}
      disabled={isUpdatingToken}
      placeholder={isPending ? "Prepare your next message..." : placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
}

/**
 * Submit button component for sending messages.
 * Automatically connects to the context to handle submission state.
 * @component MessageInput.SubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput>
 * ```
 */
const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending, value } = useMessageInputContext();
  const { cancelRun } = useTambo();
  const isUpdatingToken = useIsTamboTokenUpdating();

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await cancelRun();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  // Show different tooltip based on state
  const getTooltipContent = () => {
    if (isPending) {
      return "Click to cancel generation";
    }
    if (value.trim()) {
      return "Send message";
    }
    return "Type a message to send";
  };

  const button = (
    <button
      ref={ref}
      type={isPending ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={isPending ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={isPending ? "Cancel message" : "Send message"}
      data-slot={isPending ? "message-input-cancel" : "message-input-submit"}
      {...props}
    >
      {children ??
        (isPending ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );

  return (
    <Tooltip content={getTooltipContent()} side="top">
      {button}
    </Tooltip>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

/**
 * Props for the MessageInputNewThreadButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputNewThreadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
  /** Callback when a new thread is created */
  onNewThread?: () => void;
}

/**
 * New thread button component for starting a new conversation.
 * Uses the same styling as the submit button but with a plus icon.
 * @component MessageInput.NewThreadButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.NewThreadButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputNewThreadButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputNewThreadButtonProps
>(({ className, children, onNewThread, ...props }, ref) => {
  const { startNewThread } = useTambo();
  const isUpdatingToken = useIsTamboTokenUpdating();

  const handleNewThread = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await startNewThread();
    onNewThread?.();
  };

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="New Thread" side="top">
      <button
        ref={ref}
        type="button"
        disabled={isUpdatingToken}
        onClick={handleNewThread}
        className={buttonClasses}
        aria-label="Start new thread"
        data-slot="message-input-new-thread"
        {...props}
      >
        {children ?? <Plus className="w-5 h-5" />}
      </button>
    </Tooltip>
  );
});
MessageInputNewThreadButton.displayName = "MessageInput.NewThreadButton";

const MCPIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className="text-current"
      fill="none"
    >
      <path
        d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32823 15.921C6.22373 14.8164 6.22373 13.0255 7.32823 11.921L13.4999 5.74939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};
/**
 * MCP Config Button component for opening the MCP configuration modal.
 * @component MessageInput.McpConfigButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpConfigButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <>
      <Tooltip content="Configure MCP Servers" side="right">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={buttonClasses}
          aria-label="Open MCP Configuration"
          data-slot="message-input-mcp-config"
          {...props}
        >
          <MCPIcon />
        </button>
      </Tooltip>
      <McpConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});
MessageInputMcpConfigButton.displayName = "MessageInput.McpConfigButton";

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInput.Error
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError } = useMessageInputContext();

  if (!error && !submitError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * File attachment button component for selecting images from file system.
 * @component MessageInput.FileButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputFileButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputFileButtonProps
>(({ className, accept = "image/*", multiple = true, ...props }, ref) => {
  const { addImages } = useTamboThreadInput();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    try {
      await addImages(files);
    } catch (error) {
      console.error("Failed to add selected files:", error);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <Tooltip content="Attach Images" side="top">
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        aria-label="Attach Images"
        data-slot="message-input-file-button"
        {...props}
      >
        <Paperclip className="w-4 h-4" />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  );
});
MessageInputFileButton.displayName = "MessageInput.FileButton";

/**
 * Props for the MessageInputMcpPromptButton component.
 */
export type MessageInputMcpPromptButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * Wraps McpPromptButton and connects it to MessageInput context.
 * @component MessageInput.McpPromptButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpPromptButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpPromptButtonProps
>(({ ...props }, ref) => {
  const { setValue, value } = useMessageInputContext();
  return (
    <McpPromptButton
      ref={ref}
      {...props}
      value={value as string}
      onInsertText={setValue}
    />
  );
});
MessageInputMcpPromptButton.displayName = "MessageInput.McpPromptButton";

/**
 * Props for the MessageInputMcpResourceButton component.
 */
export type MessageInputMcpResourceButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * MCP Resource picker button component for inserting resource references from MCP servers.
 * Wraps McpResourceButton and connects it to MessageInput context.
 * @component MessageInput.McpResourceButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.FileButton />
 *     <MessageInput.McpPromptButton />
 *     <MessageInput.McpResourceButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpResourceButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputMcpResourceButtonProps
>(({ ...props }, ref) => {
  const { setValue, value } = useMessageInputContext();
  return (
    <McpResourceButton
      ref={ref}
      {...props}
      value={value as string}
      onInsertText={setValue}
    />
  );
});
MessageInputMcpResourceButton.displayName = "MessageInput.McpResourceButton";

export type MessageInputMusicGeneFilterProps =
  React.HTMLAttributes<HTMLDivElement>;

const MessageInputMusicGeneFilter = React.forwardRef<
  HTMLDivElement,
  MessageInputMusicGeneFilterProps
>(({ className, ...props }, ref) => {
  const {
    selectedMusicGeneIds,
    selectedMusicGenes,
    toggleMusicGene,
    clearMusicGenes,
  } = useMessageInputContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeCategoryId, setActiveCategoryId] =
    React.useState<(typeof musicGeneCategories)[number]["id"]>("skeleton");
  const scrollPositionsRef = React.useRef<Record<string, number>>({});
  const geneListRef = React.useRef<HTMLDivElement>(null);

  const activeCategory =
    musicGeneCategories.find((category) => category.id === activeCategoryId) ??
    musicGeneCategories[0];

  const selectedCount = selectedMusicGeneIds.length;

  const handleCategoryChange = React.useCallback(
    (categoryId: (typeof musicGeneCategories)[number]["id"]) => {
      const currentCategoryId = activeCategoryId;
      const currentScrollElement = geneListRef.current;

      if (currentScrollElement) {
        scrollPositionsRef.current[currentCategoryId] =
          currentScrollElement.scrollTop;
      }

      setActiveCategoryId(categoryId);
    },
    [activeCategoryId],
  );

  React.useLayoutEffect(() => {
    const element = geneListRef.current;
    if (!element) return;

    element.scrollTop = scrollPositionsRef.current[activeCategoryId] ?? 0;
  }, [activeCategoryId]);

  return (
    <div
      ref={ref}
      className={cn("border-b border-border pb-2", className)}
      data-slot="message-input-music-gene-filter"
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors",
            "border-border bg-background text-foreground hover:bg-muted",
          )}
          aria-expanded={isOpen}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span className="truncate">Music genes</span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] leading-none text-stone-900">
              {selectedCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={clearMusicGenes}
            className="h-8 shrink-0 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="mt-2 flex max-h-16 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {selectedMusicGenes.map((gene) => (
            <button
              key={gene.id}
              type="button"
              onClick={() => toggleMusicGene(gene.id)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-300/70 bg-amber-100/80 px-2 py-1 text-[11px] font-semibold leading-none text-stone-800 transition-colors hover:bg-amber-200"
              title={`${gene.definition} - ${gene.effect}`}
            >
              <span className="truncate">{gene.name}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="mt-2 grid h-[min(22rem,45vh)] min-h-0 grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-background">
          <div
            className="min-h-0 overflow-y-auto overscroll-contain border-r border-border bg-muted/35 p-1"
            onWheel={keepWheelInsideScrollablePanel}
          >
            {musicGeneCategories.map((category) => {
              const categorySelectedCount = category.genes.filter((gene) =>
                selectedMusicGeneIds.includes(gene.id),
              ).length;
              const isActive = activeCategory.id === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    "mb-1 flex min-h-11 w-full items-center justify-between gap-1 rounded-md px-2 text-left text-xs transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {category.label}
                    </span>
                    <span className="block truncate text-[10px] opacity-70">
                      {category.hint}
                    </span>
                  </span>
                  {categorySelectedCount > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-stone-900">
                      {categorySelectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            ref={geneListRef}
            className="min-h-0 overflow-y-auto overscroll-contain p-2"
            onWheel={keepWheelInsideScrollablePanel}
          >
            <div className="sticky top-0 z-10 mb-2 flex items-center justify-between gap-2 bg-background/95 pb-2 backdrop-blur">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">
                  {activeCategory.label}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {activeCategory.hint}
                </p>
              </div>
            </div>

            <div className="grid gap-1.5">
              {activeCategory.genes.map((gene) => {
                const isSelected = selectedMusicGeneIds.includes(gene.id);

                return (
                  <button
                    key={gene.id}
                    type="button"
                    onClick={() => toggleMusicGene(gene.id)}
                    className={cn(
                      "grid min-h-16 grid-cols-[1rem_minmax(0,1fr)] gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                      isSelected
                        ? "border-amber-300 bg-amber-100/85 text-stone-900"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 items-center justify-center rounded border",
                        isSelected
                          ? "border-amber-500 bg-amber-400 text-stone-900"
                          : "border-border bg-background",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-xs font-bold">
                          {gene.name}
                        </span>
                        <span className="shrink-0 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium opacity-70">
                          {gene.type}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug opacity-80">
                        {gene.definition}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug opacity-65">
                        {gene.effect}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
MessageInputMusicGeneFilter.displayName = "MessageInput.MusicGeneFilter";

/**
 * Props for the ImageContextBadge component.
 */
interface ImageContextBadgeProps {
  image: StagedImage;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * ContextBadge component that displays a staged image with expandable preview.
 * Shows a compact badge with icon and name by default, expands to show image preview on click.
 *
 * @component
 * @example
 * ```tsx
 * <ImageContextBadge
 *   image={stagedImage}
 *   displayName="Image"
 *   isExpanded={false}
 *   onToggle={() => setExpanded(!expanded)}
 *   onRemove={() => removeImage(image.id)}
 * />
 * ```
 */
const ImageContextBadge: React.FC<ImageContextBadgeProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group shrink-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-32 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            "opacity-100 delay-100",
          )}
        >
          <div className="relative w-full h-full">
            <Image
              src={image.dataUrl}
              alt={displayName}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded ? "opacity-0" : "opacity-100 delay-100",
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
      aria-label={`Remove ${displayName}`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

/**
 * Props for the MessageInputStagedImages component.
 */
export type MessageInputStagedImagesProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that displays currently staged images with preview and remove functionality.
 * @component MessageInput.StagedImages
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.StagedImages />
 *   <MessageInput.Textarea />
 * </MessageInput>
 * ```
 */
const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ className, ...props }, ref) => {
  const { images, removeImage } = useTamboThreadInput();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-staged-images"
      {...props}
    >
      {images.map((image, index) => (
        <ImageContextBadge
          key={image.id}
          image={image}
          displayName={
            image.file[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
          }
          isExpanded={expandedImageId === image.id}
          onToggle={() =>
            setExpandedImageId(expandedImageId === image.id ? null : image.id)
          }
          onRemove={() => removeImage(image.id)}
        />
      ))}
    </div>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

/**
 * Props for the MessageInputContextAttachments component.
 */
export type MessageInputContextAttachmentsProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that displays context attachments as removable badges.
 * @component MessageInput.ContextAttachments
 */
const MessageInputContextAttachments = React.forwardRef<
  HTMLDivElement,
  MessageInputContextAttachmentsProps
>(({ className, ...props }, ref) => {
  const { attachments, removeContextAttachment } = useTamboContextAttachment();

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-context-attachments"
      {...props}
    >
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm border border-amber-500/30"
        >
          <span className="truncate max-w-[150px]">{attachment.displayName}</span>
          <button
            type="button"
            onClick={() => removeContextAttachment(attachment.id)}
            className="ml-1 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
            aria-label={`Remove ${attachment.displayName}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
});
MessageInputContextAttachments.displayName = "MessageInput.ContextAttachments";

/**
 * Container for the toolbar components (like submit button and MCP config button).
 * Provides correct spacing and alignment.
 * @component MessageInput.Toolbar
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * ```
 */
const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-between items-center mt-2 p-1 gap-2",
        className,
      )}
      data-slot="message-input-toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Left side - everything except submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return null; // Don't render submit button here
          }
          return child;
        })}
      </div>
      <div className="flex items-center gap-2">
        <DictationButton />
        {/* Right side - only submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return child; // Only render submit button here
          }
          return null;
        })}
      </div>
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";

// --- Exports ---
export {
  DictationButton,
  MessageInput,
  MessageInputContextAttachments,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputMusicGeneFilter,
  MessageInputNewThreadButton,
  MessageInputStagedImages,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};
