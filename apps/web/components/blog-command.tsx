'use client'

import * as React from 'react'
import { Hexagon, Search, ArrowRight } from 'lucide-react'
import { Category, Post } from '@/types/post'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface BlogCommandDialogProps {
    categories: Category[]
    pageVariant: string
    posts: Post[]
}

export function BlogCommandDialog({ categories, pageVariant, posts }: BlogCommandDialogProps) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                aria-label="Search posts and categories"
                className="ring-foreground/6.5 rounded-full px-2.5">
                <Search />
                <span className="mr-12 max-md:hidden">Search...</span>

                <div className="flex gap-1 max-md:hidden">
                    {['⌘', 'K'].map((key) => (
                        <kbd
                            key={key}
                            className="bg-muted text-muted-foreground pointer-events-none inline-flex size-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
                            <span className="text-xs">{key}</span>
                        </kbd>
                    ))}
                </div>
            </Button>
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                className="ring-foreground/10 rounded-xl border-transparent ring-1">
                <CommandInput placeholder="Search posts or categories..." />
                <CommandList className="pb-1">
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Categories">
                        {categories.map((category) => (
                            <CommandItem
                                key={category.slug}
                                onSelect={() => {
                                    router.push(`/grid-1/${pageVariant}/category/${category.slug}`)
                                    setOpen(false)
                                }}>
                                <Hexagon className="not-in-data-[selected=true]:opacity-50" />
                                <span>{category.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Posts">
                        {posts.slice(0, 10).map((post) => (
                            <CommandItem
                                key={post.slug}
                                onSelect={() => {
                                    router.push(`/grid-1/${pageVariant}/${post.href}`)
                                    setOpen(false)
                                }}>
                                <ArrowRight className="not-in-data-[selected=true]:opacity-50" />
                                <div className="flex flex-col">
                                    <span className="line-clamp-1">{post.title}</span>
                                    <span className="text-muted-foreground line-clamp-1 hidden text-xs">{post.description}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}