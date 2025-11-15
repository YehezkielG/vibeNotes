import {Globe, NotebookText, Bell, Sparkles, Plus} from 'lucide-react';

export default function Navbar(){
    return (
        <nav className="block">
            <div className="container mx-auto py-2">
                <ul className="text-gray-600 text-lg font-medium">
                <li className='py-3'>
                        <a href="/explore" className="hover:text-gray-900 ">
                            <Plus className="inline mr-3" size={20} />
                            New Note
                        </a>
                    </li>
                    <li className='py-3'>
                        <a href="/explore" className="hover:text-gray-900 ">
                            <Globe className="inline mr-3" size={20} />
                            Explore
                        </a>
                    </li>
                    <li className='py-3'>
                        <a href="/explore" className="hover:text-gray-900 ">
                    <NotebookText className="inline mr-3" size={20} />
                    Your Notes</a></li>
                    <li className='py-3'><a href="/notifications" className="hover:text-gray-900 ">
                    <Bell className="inline mr-3" size={20} />
                    Notifications</a></li>
                    <li className='py-3'><a href="/messages" className="hover:text-gray-900 ">
                    <Sparkles className="inline mr-3" size={20} />
                    Insight</a></li>
                </ul>
            </div>
        </nav>
    );
};