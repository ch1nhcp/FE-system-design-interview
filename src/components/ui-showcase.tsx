'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export function UiShowcase() {
  const t = useTranslations('Showcase');

  return (
    <Card className="w-full max-w-lg text-left">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="showcase-name">{t('nameLabel')}</FieldLabel>
            <Input id="showcase-name" placeholder={t('namePlaceholder')} />
            <FieldDescription>{t('nameDescription')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="showcase-role">{t('roleLabel')}</FieldLabel>
            <Select>
              <SelectTrigger id="showcase-role" className="w-full">
                <SelectValue placeholder={t('rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('roleLabel')}</SelectLabel>
                  <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                  <SelectItem value="editor">{t('roleEditor')}</SelectItem>
                  <SelectItem value="viewer">{t('roleViewer')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="showcase-message">{t('messageLabel')}</FieldLabel>
            <Textarea id="showcase-message" placeholder={t('messagePlaceholder')} />
          </Field>
        </FieldGroup>

        <Separator />

        <Tabs defaultValue="account">
          <TabsList className="w-full">
            <TabsTrigger value="account">{t('tabAccount')}</TabsTrigger>
            <TabsTrigger value="password">{t('tabPassword')}</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="text-muted-foreground text-sm">
            {t('tabAccountContent')}
          </TabsContent>
          <TabsContent value="password" className="text-muted-foreground text-sm">
            {t('tabPasswordContent')}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex flex-wrap items-center gap-3">
          <Avatar>
            <AvatarFallback>{t('avatarFallback')}</AvatarFallback>
          </Avatar>
          <Badge>Zustand</Badge>
          <Badge variant="secondary">next-intl</Badge>
          <Badge variant="outline">shadcn/ui</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">{t('dialogTrigger')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialogTitle')}</DialogTitle>
                <DialogDescription>{t('dialogDescription')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('dialogCancel')}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>{t('dialogConfirm')}</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{t('menuTrigger')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('menuLabel')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{t('menuProfile')}</DropdownMenuItem>
                <DropdownMenuItem>{t('menuSettings')}</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">{t('menuLogout')}</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => toast(t('toastMessage'))}>{t('toastButton')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
