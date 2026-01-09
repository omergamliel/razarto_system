# קומפוננטות UI בסיסיות (`src/components/ui`)

> מרבית הקבצים מבוססים על shadcn/ui + Radix UI. כל קומפוננטה נועדה לשימוש חוזר ברחבי המערכת.

## תבניות כלליות
- רוב הקבצים מייצאים קומפוננטות React עם Wrapper סביב רכיבי Radix.
- נעשה שימוש ב־`cn()` מתוך `src/lib/utils.js` לאיחוד classNames.

## פירוט לפי קובץ

### `accordion.jsx`
- מייצא: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` – מעטפת Radix Accordion.

### `alert-dialog.jsx`
- מייצא: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`.
- `AlertDialogHeader`, `AlertDialogFooter` הן קומפוננטות עזר לעימוד.

### `alert.jsx`
- מייצא: `Alert`, `AlertTitle`, `AlertDescription` – הודעות התראה עם סגנון אחיד.

### `aspect-ratio.jsx`
- מייצא: `AspectRatio` – שמירה על יחס גובה/רוחב.

### `avatar.jsx`
- מייצא: `Avatar`, `AvatarImage`, `AvatarFallback` – עטיפת תמונת משתמש.

### `badge.jsx`
- מייצא: `Badge` – תגיות סטטוס/קטגוריה.

### `breadcrumb.jsx`
- מייצא: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`.
- `BreadcrumbSeparator`, `BreadcrumbEllipsis` הן קומפוננטות עזר לתצוגה.

### `button.jsx`
- מייצא: `Button`, `buttonVariants` – כפתור עם וריאנטים (default/destructive/outline וכו').

### `calendar.jsx`
- מייצא: `Calendar` – עטיפת `react-day-picker` עם סגנון מותאם.

### `card.jsx`
- מייצא: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### `carousel.jsx`
- מייצא: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`.

### `chart.jsx`
- מייצא: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`.
- `ChartStyle` – קומפוננטת עזר לעיצוב גרפים.

### `checkbox.jsx`
- מייצא: `Checkbox` – עטיפת Radix Checkbox.

### `collapsible.jsx`
- מייצא: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`.

### `command.jsx`
- מייצא: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`.
- `CommandDialog` ו-`CommandShortcut` הם עזרים לתצוגה.

### `context-menu.jsx`
- מייצא: `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuGroup`, `ContextMenuPortal`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuRadioGroup`.
- `ContextMenuShortcut` – קומפוננטת עזר לקיצור.

### `dialog.jsx`
- מייצא: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`.

### `drawer.jsx`
- מייצא: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`, `DrawerClose`.

### `dropdown-menu.jsx`
- מייצא: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup`.

### `form.jsx`
- מייצא: `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`.
- `useFormField()` – Hook עזר לשדות טופס.

### `hover-card.jsx`
- מייצא: `HoverCard`, `HoverCardTrigger`, `HoverCardContent`.

### `input-otp.jsx`
- מייצא: `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`.

### `input.jsx`
- מייצא: `Input` – שדה קלט מעוצב.

### `label.jsx`
- מייצא: `Label` – תווית שדה.

### `menubar.jsx`
- מייצא: `Menubar`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`, `MenubarSeparator`, `MenubarShortcut`, `MenubarGroup`, `MenubarPortal`, `MenubarSub`, `MenubarSubContent`, `MenubarSubTrigger`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarCheckboxItem`.

### `navigation-menu.jsx`
- מייצא: `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuIndicator`, `NavigationMenuViewport`.

### `pagination.jsx`
- מייצא: `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`.

### `popover.jsx`
- מייצא: `Popover`, `PopoverTrigger`, `PopoverContent`.

### `progress.jsx`
- מייצא: `Progress` – פס התקדמות.

### `radio-group.jsx`
- מייצא: `RadioGroup`, `RadioGroupItem`.

### `resizable.jsx`
- מייצא: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.

### `scroll-area.jsx`
- מייצא: `ScrollArea`, `ScrollBar`.

### `select.jsx`
- מייצא: `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`.

### `separator.jsx`
- מייצא: `Separator` – קו מפריד.

### `sheet.jsx`
- מייצא: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose`.

### `sidebar.jsx`
- מייצא: `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarInset`, `SidebarProvider`, `SidebarTrigger`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarRail` ועוד.
- כולל טיפול פנימי ב־`handleKeyDown` לנגישות.

### `skeleton.jsx`
- מייצא: `Skeleton` – שלד טעינה בסיסי.

### `slider.jsx`
- מייצא: `Slider` – פס טווח.

### `sonner.jsx`
- מייצא: `Toaster` – עטיפה ל־`sonner`.

### `switch.jsx`
- מייצא: `Switch` – מתג.

### `table.jsx`
- מייצא: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`.

### `tabs.jsx`
- מייצא: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.

### `textarea.jsx`
- מייצא: `Textarea` – שדה טקסט רב-שורה.

### `toast.jsx`
- מייצא: `Toast`, `ToastAction`, `ToastClose`, `ToastTitle`, `ToastDescription`, `ToastProvider`, `ToastViewport`.

### `toaster.jsx`
- מייצא: `Toaster()` – קומפוננטה ראשית להצגת Toasts.

### `toggle.jsx`
- מייצא: `Toggle` – כפתור toggle.

### `toggle-group.jsx`
- מייצא: `ToggleGroup`, `ToggleGroupItem`.

### `tooltip.jsx`
- מייצא: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`.

### `use-toast.jsx`
- מייצא: `useToast`, `toast`, `ToastProvider`.
- פונקציות פנימיות: `addToRemoveQueue`, `_clearFromRemoveQueue`, `reducer` לטיפול במחזור חיי הודעות.
