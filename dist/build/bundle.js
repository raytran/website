
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var routify_app = (function () {
    'use strict';

    /**
     * Hot module replacement for Svelte in the Wild
     *
     * @export
     * @param {object} Component Svelte component
     * @param {object} [options={ target: document.body }] Options for the Svelte component
     * @param {string} [id='hmr'] ID for the component container
     * @param {string} [eventName='app-loaded'] Name of the event that triggers replacement of previous component
     * @returns
     */
    function HMR(Component, options = { target: document.body }, id = 'hmr', eventName = 'app-loaded') {
        const oldContainer = document.getElementById(id);

        // Create the new (temporarily hidden) component container
        const appContainer = document.createElement("div");
        if (oldContainer) appContainer.style.visibility = 'hidden';
        else appContainer.setAttribute('id', id); //ssr doesn't get an event, so we set the id now

        // Attach it to the target element
        options.target.appendChild(appContainer);

        // Wait for the app to load before replacing the component
        addEventListener(eventName, replaceComponent);

        function replaceComponent() {
            if (oldContainer) oldContainer.remove();
            // Show our component and take over the ID of the old container
            appContainer.style.visibility = 'initial';
            // delete (appContainer.style.visibility)
            appContainer.setAttribute('id', id);
        }

        return new Component({
            ...options,
            target: appContainer
        });
    }

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var defaultConfig = {
        queryHandler: {
            parse: search => fromEntries(new URLSearchParams(search)),
            stringify: params => '?' + (new URLSearchParams(params)).toString()
        },
        urlTransform: {
            apply: x => x,
            remove: x => x
        },
        useHash: false
    };


    function fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj
        }, {})
    }

    const MATCH_PARAM = RegExp(/\:([^/()]+)/g);

    function handleScroll (element) {
      if (navigator.userAgent.includes('jsdom')) return false
      scrollAncestorsToTop(element);
      handleHash();
    }

    function handleHash () {
      if (navigator.userAgent.includes('jsdom')) return false
      const { hash } = window.location;
      if (hash) {
        const validElementIdRegex = /^[A-Za-z]+[\w\-\:\.]*$/;
        if (validElementIdRegex.test(hash.substring(1))) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView();
        }
      }
    }

    function scrollAncestorsToTop (element) {
      if (
        element &&
        element.scrollTo &&
        element.dataset.routify !== 'scroll-lock' &&
        element.dataset['routify-scroll'] !== 'lock'
      ) {
        element.style['scroll-behavior'] = 'auto';
        element.scrollTo({ top: 0, behavior: 'auto' });
        element.style['scroll-behavior'] = '';
        scrollAncestorsToTop(element.parentElement);
      }
    }

    const pathToRegex = (str, recursive) => {
      const suffix = recursive ? '' : '/?$'; //fallbacks should match recursively
      str = str.replace(/\/_fallback?$/, '(/|$)');
      str = str.replace(/\/index$/, '(/index)?'); //index files should be matched even if not present in url
      str = str.replace(MATCH_PARAM, '([^/]+)') + suffix;
      str = `^${str}`;
      return str
    };

    const pathToParamKeys = string => {
      const paramsKeys = [];
      let matches;
      while ((matches = MATCH_PARAM.exec(string))) paramsKeys.push(matches[1]);
      return paramsKeys
    };

    const pathToRank = ({ path }) => {
      return path
        .split('/')
        .filter(Boolean)
        .map(str => (str === '_fallback' ? 'A' : str.startsWith(':') ? 'B' : 'C'))
        .join('')
    };

    let warningSuppressed = false;

    /* eslint no-console: 0 */
    function suppressWarnings() {
      if (warningSuppressed) return
      const consoleWarn = console.warn;
      console.warn = function (msg, ...msgs) {
        const ignores = [
          "was created with unknown prop 'scoped'",
          "was created with unknown prop 'scopedSync'",
        ];
        if (!ignores.find(iMsg => msg.includes(iMsg)))
          return consoleWarn(msg, ...msgs)
      };
      warningSuppressed = true;
    }

    function currentLocation() {
      const path = getInternalUrlOverride();
      if (path)
        return path
      else if (defaultConfig.useHash)
        return window.location.hash.replace(/#/, '')
      else
        return window.location.pathname
    }

    function getInternalUrlOverride() {
      const pathMatch = window.location.search.match(/__routify_path=([^&]+)/);
      const prefetchMatch = window.location.search.match(/__routify_prefetch=\d+/);
      window.routify = window.routify || {};
      window.routify.prefetched = prefetchMatch ? true : false;
      const path = pathMatch && pathMatch[1].replace(/[#?].+/, ''); // strip any thing after ? and #
      return path
    }

    window.routify = window.routify || {};

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const route = writable(null); // the actual route being rendered

    /** @type {import('svelte/store').Writable<RouteNode[]>} */
    const routes = writable([]); // all routes
    routes.subscribe(routes => (window.routify.routes = routes));

    let rootContext = writable({ component: { params: {} } });

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const urlRoute = writable(null);  // the route matching the url

    const prefetchPath = writable("");

    async function onPageLoaded({ page, metatags, afterPageLoad }) {
        const { path } = page;
        const prefetchMatch = window.location.search.match(/__routify_prefetch=(\d+)/);
        const prefetchId = prefetchMatch && prefetchMatch[1];

        for (const hook of afterPageLoad._hooks) {
            // deleted/invalidated hooks are left as undefined
            if (hook) await hook(page.api);
        }

        metatags.update();

        dispatchEvent(new CustomEvent('app-loaded'));
        parent.postMessage({
            msg: 'app-loaded',
            prefetched: window.routify.prefetched,
            path,
            prefetchId
        }, "*");
        window['routify'].appLoaded = true;
        window['routify'].stopAutoReady = false;
    }

    /**
     * @param {string} url 
     * @return {ClientNode}
     */
    function urlToRoute(url) {
        url = defaultConfig.urlTransform.remove(url);

        /** @type {RouteNode[]} */
        const routes$1 = get_store_value(routes);    
        const route =
            // find a route with a matching name
            routes$1.find(route => url === route.meta.name) ||
            // or a matching path
            routes$1.find(route => url.match(route.regex));

        if (!route)
            throw new Error(
                `Route could not be found for "${url}".`
            )

        const path = url;

        if (defaultConfig.queryHandler)
            route.params = defaultConfig.queryHandler.parse(window.location.search);

        if (route.paramKeys) {
            const layouts = layoutByPos(route.layouts);
            const fragments = path.split('/').filter(Boolean);
            const routeProps = getRouteProps(route.path);

            routeProps.forEach((prop, i) => {
                if (prop) {
                    route.params[prop] = fragments[i];
                    if (layouts[i]) layouts[i].param = { [prop]: fragments[i] };
                    else route.param = { [prop]: fragments[i] };
                }
            });
        }

        route.leftover = url.replace(new RegExp(route.regex), '');

        return route
    }


    /**
     * @param {array} layouts
     */
    function layoutByPos(layouts) {
        const arr = [];
        layouts.forEach(layout => {
            arr[layout.path.split('/').filter(Boolean).length - 1] = layout;
        });
        return arr
    }


    /**
     * @param {string} url
     */
    function getRouteProps(url) {
        return url
            .split('/')
            .filter(Boolean)
            .map(f => f.match(/\:(.+)/))
            .map(f => f && f[1])
    }

    /* node_modules/@roxi/routify/runtime/Prefetcher.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1 } = globals;
    const file = "node_modules/@roxi/routify/runtime/Prefetcher.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (93:2) {#each $actives as prefetch (prefetch.options.prefetch)}
    function create_each_block(key_1, ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "title", "routify prefetcher");
    			add_location(iframe, file, 93, 4, 2705);
    			this.first = iframe;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$actives*/ 1 && iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(93:2) {#each $actives as prefetch (prefetch.options.prefetch)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$actives*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*prefetch*/ ctx[1].options.prefetch;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "__routify_iframes");
    			set_style(div, "display", "none");
    			add_location(div, file, 91, 0, 2591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$actives*/ 1) {
    				const each_value = /*$actives*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const iframeNum = 2;

    const defaults = {
    	validFor: 60,
    	timeout: 5000,
    	gracePeriod: 1000
    };

    /** stores and subscriptions */
    const queue = writable([]);

    const actives = derived(queue, q => q.slice(0, iframeNum));

    actives.subscribe(actives => actives.forEach(({ options }) => {
    	setTimeout(() => removeFromQueue(options.prefetch), options.timeout);
    }));

    function prefetch(path, options = {}) {
    	prefetch.id = prefetch.id || 1;

    	path = !path.href
    	? path
    	: path.href.replace(/^(?:\/\/|[^/]+)*\//, "/");

    	//replace first ? since were mixing user queries with routify queries
    	path = path.replace("?", "&");

    	options = { ...defaults, ...options, path };
    	options.prefetch = prefetch.id++;

    	//don't prefetch within prefetch or SSR
    	if (window.routify.prefetched || navigator.userAgent.match("jsdom")) return false;

    	// add to queue
    	queue.update(q => {
    		if (!q.some(e => e.options.path === path)) q.push({
    			url: `/__app.html?${optionsToQuery(options)}`,
    			options
    		});

    		return q;
    	});
    }

    /**
     * convert options to query string
     * {a:1,b:2} becomes __routify_a=1&routify_b=2
     * @param {defaults & {path: string, prefetch: number}} options
     */
    function optionsToQuery(options) {
    	return Object.entries(options).map(([key, val]) => `__routify_${key}=${val}`).join("&");
    }

    /**
     * @param {number|MessageEvent} idOrEvent
     */
    function removeFromQueue(idOrEvent) {
    	const id = idOrEvent.data ? idOrEvent.data.prefetchId : idOrEvent;
    	if (!id) return null;
    	const entry = get_store_value(queue).find(entry => entry && entry.options.prefetch == id);

    	// removeFromQueue is called by both eventListener and timeout,
    	// but we can only remove the item once
    	if (entry) {
    		const { gracePeriod } = entry.options;
    		const gracePromise = new Promise(resolve => setTimeout(resolve, gracePeriod));

    		const idlePromise = new Promise(resolve => {
    				window.requestIdleCallback
    				? window.requestIdleCallback(resolve)
    				: setTimeout(resolve, gracePeriod + 1000);
    			});

    		Promise.all([gracePromise, idlePromise]).then(() => {
    			queue.update(q => q.filter(q => q.options.prefetch != id));
    		});
    	}
    }

    // Listen to message from child window
    addEventListener("message", removeFromQueue, false);

    function instance($$self, $$props, $$invalidate) {
    	let $actives;
    	validate_store(actives, "actives");
    	component_subscribe($$self, actives, $$value => $$invalidate(0, $actives = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Prefetcher", slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Prefetcher> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		writable,
    		derived,
    		get: get_store_value,
    		iframeNum,
    		defaults,
    		queue,
    		actives,
    		prefetch,
    		optionsToQuery,
    		removeFromQueue,
    		$actives
    	});

    	return [$actives];
    }

    class Prefetcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prefetcher",
    			options,
    			id: create_fragment.name
    		});
    	}
    }
    Prefetcher.$compile = {"vars":[{"name":"writable","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"derived","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"get","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"iframeNum","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"defaults","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"queue","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"actives","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"prefetch","export_name":"prefetch","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"optionsToQuery","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"removeFromQueue","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"$actives","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    /// <reference path="../typedef.js" />

    /** @ts-check */
    /**
     * @typedef {Object} RoutifyContext
     * @prop {ClientNode} component
     * @prop {ClientNode} layout
     * @prop {any} componentFile 
     * 
     *  @returns {import('svelte/store').Readable<RoutifyContext>} */
    function getRoutifyContext() {
      return getContext('routify') || rootContext
    }


    /**
     * @typedef {import('svelte/store').Readable<ClientNodeApi>} ClientNodeHelperStore
     * @type { ClientNodeHelperStore } 
     */
    const page = {
      subscribe(run) {
        return derived(route, route => route.api).subscribe(run)
      }
    };

    /** @type {ClientNodeHelperStore} */
    const layout = {
      subscribe(run) {
        const ctx = getRoutifyContext();
        return derived(ctx, ctx => ctx.layout.api).subscribe(run)
      }
    };

    /**
     * @callback AfterPageLoadHelper
     * @param {function} callback
     * 
     * @typedef {import('svelte/store').Readable<AfterPageLoadHelper> & {_hooks:Array<function>}} AfterPageLoadHelperStore
     * @type {AfterPageLoadHelperStore}
     */
    const afterPageLoad = {
      _hooks: [],
      subscribe: hookHandler
    };

    /** 
     * @callback BeforeUrlChangeHelper
     * @param {function} callback
     *
     * @typedef {import('svelte/store').Readable<BeforeUrlChangeHelper> & {_hooks:Array<function>}} BeforeUrlChangeHelperStore
     * @type {BeforeUrlChangeHelperStore}
     **/
    const beforeUrlChange = {
      _hooks: [],
      subscribe: hookHandler
    };

    function hookHandler(listener) {
      const hooks = this._hooks;
      const index = hooks.length;
      listener(callback => { hooks[index] = callback; });
      return () => delete hooks[index]
    }

    /**
     * @callback UrlHelper
     * @param {String=} path
     * @param {UrlParams=} params
     * @param {UrlOptions=} options
     * @return {String}
     *
     * @typedef {import('svelte/store').Readable<UrlHelper>} UrlHelperStore
     * @type {UrlHelperStore} 
     * */
    const url = {
      subscribe(listener) {
        const ctx = getRoutifyContext();
        return derived(
          [ctx, route, routes],
          args => makeUrlHelper(...args)
        ).subscribe(
          listener
        )
      }
    };

    /** 
     * @param {{component: ClientNode}} $ctx 
     * @param {RouteNode} $currentRoute 
     * @param {RouteNode[]} $routes 
     * @returns {UrlHelper}
     */
    function makeUrlHelper($ctx, $currentRoute, $routes) {
      return function url(path, params, options) {
        const { component } = $ctx;
        let el = path && path.nodeType && path;

        if (el)
          path = path.getAttribute('href');

        path = resolvePath(path);

        // preload the route  
        const route = $routes.find(route => [route.shortPath || '/', route.path].includes(path));
        if (route && route.meta.preload === 'proximity' && window.requestIdleCallback) {
          const delay = routify.appLoaded ? 0 : 1500;
          setTimeout(() => {
            window.requestIdleCallback(() => route.api.preload());
          }, delay);
        }

        const strict = options && options.strict !== false;
        if (!strict) path = path.replace(/index$/, '');

        let url = resolveUrl(path, params);

        if (el) {
          el.href = url;
          return {
            update(params) { el.href = resolveUrl(path, params); }
          }
        }


        return defaultConfig.urlTransform.apply(url)

        function resolvePath(path) {
          if (!path) {
            path = component.shortPath; // use current path
          }
          else if (path.match(/^\.\.?\//)) {
            //RELATIVE PATH
            let [, breadcrumbs, relativePath] = path.match(/^([\.\/]+)(.*)/);
            let dir = component.path.replace(/\/$/, '');
            const traverse = breadcrumbs.match(/\.\.\//g) || [];
            if (component.isPage) traverse.push(null);
            traverse.forEach(() => dir = dir.replace(/\/[^\/]+\/?$/, ''));
            path = `${dir}/${relativePath}`.replace(/\/$/, '');
            path = path || '/'; // empty means root
          } else if (path.match(/^\//)) ; else {
            // NAMED PATH
            const matchingRoute = $routes.find(route => route.meta.name === path);
            if (matchingRoute) path = matchingRoute.shortPath;
          }
          return path
        }

        function resolveUrl(path, params) {
          const url = populateUrl(path, params);
          if (defaultConfig.useHash)
            return `#${url}`
          else
            return url
        }

        function populateUrl(path, params) {
          /** @type {Object<string, *>} Parameters */
          const allParams = Object.assign({}, $currentRoute.params, component.params, params);
          let pathWithParams = path;
          for (const [key, value] of Object.entries(allParams)) {
            pathWithParams = pathWithParams.replace(`:${key}`, value);
          }


          const _fullPath = pathWithParams + _getQueryString(path, params);
          return _fullPath.replace(/\?$/, '')
        }
      }
    }

    /**
     * 
     * @param {string} path 
     * @param {object} params 
     */
    function _getQueryString(path, params) {
      if (!defaultConfig.queryHandler) return ""
      const pathParamKeys = pathToParamKeys(path);
      const queryParams = {};
      if (params) Object.entries(params).forEach(([key, value]) => {
        if (!pathParamKeys.includes(key))
          queryParams[key] = value;
      });
      return defaultConfig.queryHandler.stringify(queryParams)
    }

    /**
     * @callback IsActiveHelper
     * @param {String=} path
     * @param {UrlParams=} params
     * @param {UrlOptions=} options
     * @returns {Boolean}
     * 
     * @typedef {import('svelte/store').Readable<IsActiveHelper>} IsActiveHelperStore
     * @type {IsActiveHelperStore} 
     * */
    const isActive = {
      subscribe(run) {
        return derived(
          [url, route],
          ([url, route]) => function isActive(path = "", params = {}, { strict } = { strict: true }) {
            path = url(path, null, { strict });
            const currentPath = url(route.path, null, { strict });
            const re = new RegExp('^' + path + '($|/)');
            return !!currentPath.match(re)
          }
        ).subscribe(run)
      },
    };



    const _metatags = {
      props: {},
      templates: {},
      services: {
        plain: { propField: 'name', valueField: 'content' },
        twitter: { propField: 'name', valueField: 'content' },
        og: { propField: 'property', valueField: 'content' },
      },
      plugins: [
        {
          name: 'applyTemplate',
          condition: () => true,
          action: (prop, value) => {
            const template = _metatags.getLongest(_metatags.templates, prop) || (x => x);
            return [prop, template(value)]
          }
        },
        {
          name: 'createMeta',
          condition: () => true,
          action(prop, value) {
            _metatags.writeMeta(prop, value);
          }
        },
        {
          name: 'createOG',
          condition: prop => !prop.match(':'),
          action(prop, value) {
            _metatags.writeMeta(`og:${prop}`, value);
          }
        },
        {
          name: 'createTitle',
          condition: prop => prop === 'title',
          action(prop, value) {
            document.title = value;
          }
        }
      ],
      getLongest(repo, name) {
        const providers = repo[name];
        if (providers) {
          const currentPath = get_store_value(route).path;
          const allPaths = Object.keys(repo[name]);
          const matchingPaths = allPaths.filter(path => currentPath.includes(path));

          const longestKey = matchingPaths.sort((a, b) => b.length - a.length)[0];

          return providers[longestKey]
        }
      },
      writeMeta(prop, value) {
        const head = document.getElementsByTagName('head')[0];
        const match = prop.match(/(.+)\:/);
        const serviceName = match && match[1] || 'plain';
        const { propField, valueField } = metatags.services[serviceName] || metatags.services.plain;
        const oldElement = document.querySelector(`meta[${propField}='${prop}']`);
        if (oldElement) oldElement.remove();

        const newElement = document.createElement('meta');
        newElement.setAttribute(propField, prop);
        newElement.setAttribute(valueField, value);
        newElement.setAttribute('data-origin', 'routify');
        head.appendChild(newElement);
      },
      set(prop, value) {
        _metatags.plugins.forEach(plugin => {
          if (plugin.condition(prop, value))
            [prop, value] = plugin.action(prop, value) || [prop, value];
        });
      },
      clear() {
        const oldElement = document.querySelector(`meta`);
        if (oldElement) oldElement.remove();
      },
      template(name, fn) {
        const origin = _metatags.getOrigin();
        _metatags.templates[name] = _metatags.templates[name] || {};
        _metatags.templates[name][origin] = fn;
      },
      update() {
        Object.keys(_metatags.props).forEach((prop) => {
          let value = (_metatags.getLongest(_metatags.props, prop));
          _metatags.plugins.forEach(plugin => {
            if (plugin.condition(prop, value)) {
              [prop, value] = plugin.action(prop, value) || [prop, value];

            }
          });
        });
      },
      batchedUpdate() {
        if (!_metatags._pendingUpdate) {
          _metatags._pendingUpdate = true;
          setTimeout(() => {
            _metatags._pendingUpdate = false;
            this.update();
          });
        }
      },
      _updateQueued: false,
      getOrigin() {
        const routifyCtx = getRoutifyContext();
        return routifyCtx && get_store_value(routifyCtx).path || '/'
      },
      _pendingUpdate: false
    };


    /**
     * metatags
     * @prop {Object.<string, string>}
     */
    const metatags = new Proxy(_metatags, {
      set(target, name, value, receiver) {
        const { props, getOrigin } = target;

        if (Reflect.has(target, name))
          Reflect.set(target, name, value, receiver);
        else {
          props[name] = props[name] || {};
          props[name][getOrigin()] = value;
        }

        if (window['routify'].appLoaded)
          target.batchedUpdate();
        return true
      }
    });


    const isChangingPage = (function () {
      const isChangingPageStore = writable(true);

      beforeUrlChange.subscribe(fn => fn(event => isChangingPageStore.set(true) || true));
      afterPageLoad.subscribe(fn => fn(event => isChangingPageStore.set(false)));

      return isChangingPageStore
    })();

    /* node_modules/@roxi/routify/runtime/Route.svelte generated by Svelte v3.31.0 */
    const file$1 = "node_modules/@roxi/routify/runtime/Route.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i].component;
    	child_ctx[21] = list[i].componentFile;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i].component;
    	child_ctx[21] = list[i].componentFile;
    	return child_ctx;
    }

    // (110:0) {#if $context}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$context*/ ctx[5].component.isLayout === false) return 0;
    		if (/*remainingNodes*/ ctx[4].length) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(110:0) {#if $context}",
    		ctx
    	});

    	return block;
    }

    // (122:34) 
    function create_if_block_2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = [/*$context*/ ctx[5]];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*component*/ ctx[20].path;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, node, remainingNodes, decorator, Decorator, scopeToChild*/ 201326655) {
    				const each_value_1 = [/*$context*/ ctx[5]];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(122:34) ",
    		ctx
    	});

    	return block;
    }

    // (111:2) {#if $context.component.isLayout === false}
    function create_if_block_1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = [/*$context*/ ctx[5]];
    	validate_each_argument(each_value);
    	const get_key = ctx => getID(/*component*/ ctx[20]);
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, node*/ 45) {
    				const each_value = [/*$context*/ ctx[5]];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(111:2) {#if $context.component.isLayout === false}",
    		ctx
    	});

    	return block;
    }

    // (124:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...node.param || {}}>
    function create_default_slot(ctx) {
    	let route_1;
    	let t;
    	let current;

    	route_1 = new Route({
    			props: {
    				nodes: [.../*remainingNodes*/ ctx[4]],
    				Decorator: typeof /*decorator*/ ctx[27] !== "undefined"
    				? /*decorator*/ ctx[27]
    				: /*Decorator*/ ctx[1],
    				childOfDecorator: /*node*/ ctx[2].isDecorator,
    				scoped: {
    					.../*scoped*/ ctx[0],
    					.../*scopeToChild*/ ctx[26]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*remainingNodes*/ 16) route_1_changes.nodes = [.../*remainingNodes*/ ctx[4]];

    			if (dirty & /*decorator, Decorator*/ 134217730) route_1_changes.Decorator = typeof /*decorator*/ ctx[27] !== "undefined"
    			? /*decorator*/ ctx[27]
    			: /*Decorator*/ ctx[1];

    			if (dirty & /*node*/ 4) route_1_changes.childOfDecorator = /*node*/ ctx[2].isDecorator;

    			if (dirty & /*scoped, scopeToChild*/ 67108865) route_1_changes.scoped = {
    				.../*scoped*/ ctx[0],
    				.../*scopeToChild*/ ctx[26]
    			};

    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(124:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...node.param || {}}>",
    		ctx
    	});

    	return block;
    }

    // (123:4) {#each [$context] as { component, componentFile }
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[3] },
    		/*node*/ ctx[2].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[21];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: {
    				default: [
    					create_default_slot,
    					({ scoped: scopeToChild, decorator }) => ({ 26: scopeToChild, 27: decorator }),
    					({ scoped: scopeToChild, decorator }) => (scopeToChild ? 67108864 : 0) | (decorator ? 134217728 : 0)
    				]
    			},
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, node*/ 13)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 8 && { scopedSync: /*scopedSync*/ ctx[3] },
    					dirty & /*node*/ 4 && get_spread_object(/*node*/ ctx[2].param || {})
    				])
    			: {};

    			if (dirty & /*$$scope, remainingNodes, decorator, Decorator, node, scoped, scopeToChild*/ 469762071) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[21])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(123:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (112:4) {#each [$context] as { component, componentFile }
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[3] },
    		/*node*/ ctx[2].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[21];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, node*/ 13)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 8 && { scopedSync: /*scopedSync*/ ctx[3] },
    					dirty & /*node*/ 4 && get_spread_object(/*node*/ ctx[2].param || {})
    				])
    			: {};

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[21])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(112:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t;
    	let span;
    	let setparentNode_action;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*$context*/ ctx[5] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			span = element("span");
    			add_location(span, file$1, 141, 0, 4192);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, span, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(setparentNode_action = /*setparentNode*/ ctx[8].call(null, span));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$context*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$context*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getID({ meta, path, param, params }) {
    	return JSON.stringify({
    		path,
    		param: (meta["param-is-page"] || meta["slug-is-page"]) && param,
    		queryParams: meta["query-params-is-page"] && params
    	});
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $parentContextStore;
    	let $route;
    	let $context;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(16, $route = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, []);
    	let { nodes = [] } = $$props;
    	let { scoped = {} } = $$props;
    	let { Decorator = null } = $$props;
    	let { childOfDecorator = false } = $$props;
    	let { isRoot = false } = $$props;
    	let scopedSync = {};
    	let isDecorator = false;

    	/** @type {LayoutOrDecorator} */
    	let node = null;

    	/** @type {LayoutOrDecorator[]} */
    	let remainingNodes = [];

    	const context = writable(null);
    	validate_store(context, "context");
    	component_subscribe($$self, context, value => $$invalidate(5, $context = value));

    	/** @type {import("svelte/store").Writable<Context>} */
    	const parentContextStore = getContext("routify");

    	validate_store(parentContextStore, "parentContextStore");
    	component_subscribe($$self, parentContextStore, value => $$invalidate(13, $parentContextStore = value));
    	let parentNode;
    	const setparentNode = el => parentNode = el.parentNode;
    	isDecorator = Decorator && !childOfDecorator;
    	setContext("routify", context);

    	/** @param {SvelteComponent} componentFile */
    	function onComponentLoaded(componentFile) {
    		/** @type {Context} */
    		$$invalidate(3, scopedSync = { ...scoped });

    		if (remainingNodes.length === 0) onLastComponentLoaded();

    		const ctx = {
    			layout: node.isLayout && node || parentContext && parentContext.layout,
    			component: node,
    			route: $route,
    			componentFile,
    			parentNode: parentNode || parentContext && parentContext.parentNode
    		};

    		context.set(ctx);
    		if (isRoot) rootContext.set(ctx);
    	}

    	/**  @param {LayoutOrDecorator} node */
    	function setComponent(node) {
    		let PendingComponent = node.component();
    		if (PendingComponent instanceof Promise) PendingComponent.then(onComponentLoaded); else onComponentLoaded(PendingComponent);
    	}

    	async function onLastComponentLoaded() {
    		await tick();
    		handleScroll(parentNode);
    		const isOnCurrentRoute = $context.component.path === $route.path; //maybe we're getting redirected

    		// Let everyone know the last child has rendered
    		if (!window["routify"].stopAutoReady && isOnCurrentRoute) {
    			onPageLoaded({
    				page: $context.component,
    				metatags,
    				afterPageLoad
    			});
    		}
    	}

    	const writable_props = ["nodes", "scoped", "Decorator", "childOfDecorator", "isRoot"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("nodes" in $$props) $$invalidate(9, nodes = $$props.nodes);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		tick,
    		writable,
    		get: get_store_value,
    		metatags,
    		afterPageLoad,
    		route,
    		rootContext,
    		handleScroll,
    		onPageLoaded,
    		nodes,
    		scoped,
    		Decorator,
    		childOfDecorator,
    		isRoot,
    		scopedSync,
    		isDecorator,
    		node,
    		remainingNodes,
    		context,
    		parentContextStore,
    		parentNode,
    		setparentNode,
    		onComponentLoaded,
    		setComponent,
    		onLastComponentLoaded,
    		getID,
    		parentContext,
    		$parentContextStore,
    		$route,
    		$context
    	});

    	$$self.$inject_state = $$props => {
    		if ("nodes" in $$props) $$invalidate(9, nodes = $$props.nodes);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    		if ("scopedSync" in $$props) $$invalidate(3, scopedSync = $$props.scopedSync);
    		if ("isDecorator" in $$props) $$invalidate(12, isDecorator = $$props.isDecorator);
    		if ("node" in $$props) $$invalidate(2, node = $$props.node);
    		if ("remainingNodes" in $$props) $$invalidate(4, remainingNodes = $$props.remainingNodes);
    		if ("parentNode" in $$props) parentNode = $$props.parentNode;
    		if ("parentContext" in $$props) parentContext = $$props.parentContext;
    	};

    	let parentContext;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$parentContextStore*/ 8192) {
    			 parentContext = $parentContextStore;
    		}

    		if ($$self.$$.dirty & /*isDecorator, Decorator, nodes*/ 4610) {
    			 if (isDecorator) {
    				const decoratorLayout = {
    					component: () => Decorator,
    					path: `${nodes[0].path}__decorator`,
    					isDecorator: true
    				};

    				$$invalidate(9, nodes = [decoratorLayout, ...nodes]);
    			}
    		}

    		if ($$self.$$.dirty & /*nodes*/ 512) {
    			 $$invalidate(2, [node, ...remainingNodes] = nodes, node, ((($$invalidate(4, remainingNodes), $$invalidate(9, nodes)), $$invalidate(12, isDecorator)), $$invalidate(1, Decorator)));
    		}

    		if ($$self.$$.dirty & /*node*/ 4) {
    			 setComponent(node);
    		}
    	};

    	return [
    		scoped,
    		Decorator,
    		node,
    		scopedSync,
    		remainingNodes,
    		$context,
    		context,
    		parentContextStore,
    		setparentNode,
    		nodes,
    		childOfDecorator,
    		isRoot,
    		isDecorator,
    		$parentContextStore
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			nodes: 9,
    			scoped: 0,
    			Decorator: 1,
    			childOfDecorator: 10,
    			isRoot: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get nodes() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodes(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scoped() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scoped(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Decorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Decorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childOfDecorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childOfDecorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRoot() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRoot(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    Route.$compile = {"vars":[{"name":"getContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"setContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"tick","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"writable","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"get","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"afterPageLoad","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"route","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"rootContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"handleScroll","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onPageLoaded","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"nodes","export_name":"nodes","injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"scoped","export_name":"scoped","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"Decorator","export_name":"Decorator","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"childOfDecorator","export_name":"childOfDecorator","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"isRoot","export_name":"isRoot","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"scopedSync","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"isDecorator","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"node","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"remainingNodes","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"context","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"parentContextStore","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"parentNode","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"setparentNode","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"onComponentLoaded","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"setComponent","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onLastComponentLoaded","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"getID","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"parentContext","export_name":null,"injected":true,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$parentContextStore","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$route","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$context","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    function init$1(routes, callback) {
      /** @type { ClientNode | false } */
      let lastRoute = false;

      async function updatePage(proxyToUrl, shallow) {
        const url = proxyToUrl || currentLocation();
        const route$1 = urlToRoute(url);
        const currentRoute = shallow && urlToRoute(currentLocation());
        const contextRoute = currentRoute || route$1;
        const nodes = [...contextRoute.layouts, route$1];
        if (lastRoute) delete lastRoute.last; //todo is a page component the right place for the previous route?
        route$1.last = lastRoute;
        lastRoute = route$1;

        //set the route in the store
        if (!proxyToUrl)
          urlRoute.set(route$1);
        route.set(route$1);

        //preload components in parallel
        await route$1.api.preload();

        //run callback in Router.svelte
        callback(nodes);
      }

      const destroy = createEventListeners(updatePage);

      return { updatePage, destroy }
    }

    /**
     * svelte:window events doesn't work on refresh
     * @param {Function} updatePage
     */
    function createEventListeners(updatePage) {
    ['pushState', 'replaceState'].forEach(eventName => {
        const fn = history[eventName];
        history[eventName] = async function (state = {}, title, url) {
          const { id, path, params } = get_store_value(route);
          state = { id, path, params, ...state };
          const event = new Event(eventName.toLowerCase());
          Object.assign(event, { state, title, url });

          if (await runHooksBeforeUrlChange(event)) {
            fn.apply(this, [state, title, url]);
            return dispatchEvent(event)
          }
        };
      });

      let _ignoreNextPop = false;

      const listeners = {
        click: handleClick,
        pushstate: () => updatePage(),
        replacestate: () => updatePage(),
        popstate: async event => {
          if (_ignoreNextPop)
            _ignoreNextPop = false;
          else {
            if (await runHooksBeforeUrlChange(event)) {
              updatePage();
            } else {
              _ignoreNextPop = true;
              event.preventDefault();
              history.go(1);
            }
          }
        },
      };

      Object.entries(listeners).forEach(args => addEventListener(...args));

      const unregister = () => {
        Object.entries(listeners).forEach(args => removeEventListener(...args));
      };

      return unregister
    }

    function handleClick(event) {
      const el = event.target.closest('a');
      const href = el && el.getAttribute('href');

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.button ||
        event.defaultPrevented
      )
        return
      if (!href || el.target || el.host !== location.host) return

      event.preventDefault();
      history.pushState({}, '', href);
    }

    async function runHooksBeforeUrlChange(event) {
      const route$1 = get_store_value(route);
      for (const hook of beforeUrlChange._hooks.filter(Boolean)) {
        // return false if the hook returns false
        const result = await hook(event, route$1); //todo remove route from hook. Its API Can be accessed as $page
        if (!result) return false
      }
      return true
    }

    /* node_modules/@roxi/routify/runtime/Router.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1$1 } = globals;

    // (61:0) {#if nodes && $route !== null}
    function create_if_block$1(ctx) {
    	let route_1;
    	let current;

    	route_1 = new Route({
    			props: { nodes: /*nodes*/ ctx[0], isRoot: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*nodes*/ 1) route_1_changes.nodes = /*nodes*/ ctx[0];
    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(61:0) {#if nodes && $route !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let prefetcher;
    	let current;
    	let if_block = /*nodes*/ ctx[0] && /*$route*/ ctx[1] !== null && create_if_block$1(ctx);
    	prefetcher = new Prefetcher({ $$inline: true });

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(prefetcher.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(prefetcher, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*nodes*/ ctx[0] && /*$route*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*nodes, $route*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(prefetcher.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(prefetcher.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(prefetcher, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $route;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(1, $route = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes: routes$1 } = $$props;
    	let { config = {} } = $$props;
    	let nodes;
    	let navigator;
    	window.routify = window.routify || {};
    	window.routify.inBrowser = !window.navigator.userAgent.match("jsdom");
    	Object.assign(defaultConfig, config);
    	suppressWarnings();
    	const updatePage = (...args) => navigator && navigator.updatePage(...args);
    	setContext("routifyupdatepage", updatePage);
    	const callback = res => $$invalidate(0, nodes = res);

    	const cleanup = () => {
    		if (!navigator) return;
    		navigator.destroy();
    		navigator = null;
    	};

    	let initTimeout = null;

    	// init is async to prevent a horrible bug that completely disable reactivity
    	// in the host component -- something like the component's update function is
    	// called before its fragment is created, and since the component is then seen
    	// as already dirty, it is never scheduled for update again, and remains dirty
    	// forever... I failed to isolate the precise conditions for the bug, but the
    	// faulty update is triggered by a change in the route store, and so offseting
    	// store initialization by one tick gives the host component some time to
    	// create its fragment. The root cause it probably a bug in Svelte with deeply
    	// intertwinned store and reactivity.
    	const doInit = () => {
    		clearTimeout(initTimeout);

    		initTimeout = setTimeout(() => {
    			cleanup();
    			navigator = init$1(routes$1, callback);
    			routes.set(routes$1);
    			navigator.updatePage();
    		});
    	};

    	onDestroy(cleanup);
    	const writable_props = ["routes", "config"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		onDestroy,
    		Route,
    		Prefetcher,
    		init: init$1,
    		route,
    		routesStore: routes,
    		prefetchPath,
    		suppressWarnings,
    		defaultConfig,
    		routes: routes$1,
    		config,
    		nodes,
    		navigator,
    		updatePage,
    		callback,
    		cleanup,
    		initTimeout,
    		doInit,
    		$route
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    		if ("nodes" in $$props) $$invalidate(0, nodes = $$props.nodes);
    		if ("navigator" in $$props) navigator = $$props.navigator;
    		if ("initTimeout" in $$props) initTimeout = $$props.initTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*routes*/ 4) {
    			 if (routes$1) doInit();
    		}
    	};

    	return [nodes, $route, routes$1, config];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routes: 2, config: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*routes*/ ctx[2] === undefined && !("routes" in props)) {
    			console.warn("<Router> was created without expected prop 'routes'");
    		}
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    Router.$compile = {"vars":[{"name":"setContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onDestroy","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"Route","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"Prefetcher","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"init","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"route","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"routesStore","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"prefetchPath","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"suppressWarnings","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"defaultConfig","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"routes","export_name":"routes","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"config","export_name":"config","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"nodes","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"navigator","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"updatePage","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"callback","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"cleanup","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"initTimeout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"doInit","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"$route","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    /** 
     * Node payload
     * @typedef {Object} NodePayload
     * @property {RouteNode=} file current node
     * @property {RouteNode=} parent parent of the current node
     * @property {StateObject=} state state shared by every node in the walker
     * @property {Object=} scope scope inherited by descendants in the scope
     *
     * State Object
     * @typedef {Object} StateObject
     * @prop {TreePayload=} treePayload payload from the tree
     * 
     * Node walker proxy
     * @callback NodeWalkerProxy
     * @param {NodePayload} NodePayload
     */


    /**
     * Node middleware
     * @description Walks through the nodes of a tree
     * @example middleware = createNodeMiddleware(payload => {payload.file.name = 'hello'})(treePayload))
     * @param {NodeWalkerProxy} fn 
     */
    function createNodeMiddleware(fn) {

        /**    
         * NodeMiddleware payload receiver
         * @param {TreePayload} payload
         */
        const inner = async function execute(payload) {
            return await nodeMiddleware(fn, {
                file: payload.tree,
                state: { treePayload: payload },
                scope: {}
            })
        };

        /**    
         * NodeMiddleware sync payload receiver
         * @param {TreePayload} payload
         */
        inner.sync = function executeSync(payload) {
            return nodeMiddlewareSync(fn, {
                file: payload.tree,
                state: { treePayload: payload },
                scope: {}
            })
        };

        return inner
    }

    /**
     * Node walker
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    async function nodeMiddleware(fn, payload) {
        const _file = await fn(payload);
        if (_file === false) return false
        const file = _file || payload.file;

        if (file.children) {
            const children = await Promise.all(file.children.map(async _file => nodeMiddleware(fn, {
                state: payload.state,
                scope: clone(payload.scope || {}),
                parent: payload.file,
                file: await _file
            })));
            file.children = children.filter(Boolean);
        }

        return file
    }

    /**
     * Node walker (sync version)
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    function nodeMiddlewareSync(fn, payload) {
        const _file = fn(payload);
        if (_file === false) return false

        const file = _file || payload.file;

        if (file.children) {
            const children = file.children.map(_file => nodeMiddlewareSync(fn, {
                state: payload.state,
                scope: clone(payload.scope || {}),
                parent: payload.file,
                file: _file
            }));
            file.children = children.filter(Boolean);
        }

        return file
    }


    /**
     * Clone with JSON
     * @param {T} obj 
     * @returns {T} JSON cloned object
     * @template T
     */
    function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

    const setRegex = createNodeMiddleware(({ file }) => {
        if (file.isPage || file.isFallback)
            file.regex = pathToRegex(file.path, file.isFallback);
    });
    const setParamKeys = createNodeMiddleware(({ file }) => {
        file.paramKeys = pathToParamKeys(file.path);
    });

    const setShortPath = createNodeMiddleware(({ file }) => {
        if (file.isFallback || file.isIndex)
            file.shortPath = file.path.replace(/\/[^/]+$/, '');
        else file.shortPath = file.path;
    });
    const setRank = createNodeMiddleware(({ file }) => {
        file.ranking = pathToRank(file);
    });


    // todo delete?
    const addMetaChildren = createNodeMiddleware(({ file }) => {
        const node = file;
        const metaChildren = file.meta && file.meta.children || [];
        if (metaChildren.length) {
            node.children = node.children || [];
            node.children.push(...metaChildren.map(meta => ({ isMeta: true, ...meta, meta })));
        }
    });

    const setIsIndexable = createNodeMiddleware(payload => {
        const { file } = payload;
        const { isFallback, meta } = file;
        const isDynamic = file.path.match('/:');
        const isIndex = file.path.endsWith('/index');
        const isIndexed = meta.index || meta.index === 0;
        const isHidden = meta.index === false;

        file.isIndexable = isIndexed || (!isFallback && !isDynamic && !isIndex && !isHidden);
        file.isNonIndexable = !file.isIndexable;
    });

    const assignRelations = createNodeMiddleware(({ file, parent }) => {
        Object.defineProperty(file, 'parent', { get: () => parent });
        Object.defineProperty(file, 'nextSibling', { get: () => _getSibling(file, 1) });
        Object.defineProperty(file, 'prevSibling', { get: () => _getSibling(file, -1) });
        Object.defineProperty(file, 'lineage', { get: () => _getLineage(parent) });
    });

    function _getLineage(node, lineage = []) {
        if (node) {
            lineage.unshift(node);
            _getLineage(node.parent, lineage);
        }
        return lineage
    }

    /**
     * 
     * @param {RouteNode} file 
     * @param {Number} direction 
     */
    function _getSibling(file, direction) {
        if (!file.root) {
            const siblings = file.parent.children.filter(c => c.isIndexable);
            const index = siblings.indexOf(file);
            return siblings[index + direction]
        }
    }

    const assignIndex = createNodeMiddleware(({ file, parent }) => {
        if (file.isIndex) Object.defineProperty(parent, 'index', { get: () => file });
    });

    const assignLayout = createNodeMiddleware(({ file, scope }) => {
        Object.defineProperty(file, 'layouts', { get: () => getLayouts(file) });
        function getLayouts(file) {
            const { parent } = file;
            const layout = parent && parent.component && parent;
            const isReset = layout && layout.isReset;
            const layouts = (parent && !isReset && getLayouts(parent)) || [];
            if (layout) layouts.push(layout);
            return layouts
        }
    });


    const createFlatList = treePayload => {
        createNodeMiddleware(payload => {
            if (payload.file.isPage || payload.file.isFallback)
                payload.state.treePayload.routes.push(payload.file);
        }).sync(treePayload);
        treePayload.routes.sort((c, p) => (c.ranking >= p.ranking ? -1 : 1));
    };

    const setPrototype = createNodeMiddleware(({ file }) => {
        const Prototype = file.root
            ? Root
            : file.children
                ? file.isPage ? PageDir : Dir
                : file.isReset
                    ? Reset
                    : file.isLayout
                        ? Layout
                        : file.isFallback
                            ? Fallback
                            : Page;
        Object.setPrototypeOf(file, Prototype.prototype);

        function Layout() { }
        function Dir() { }
        function Fallback() { }
        function Page() { }
        function PageDir() { }
        function Reset() { }
        function Root() { }
    });

    var miscPlugins = /*#__PURE__*/Object.freeze({
        __proto__: null,
        setRegex: setRegex,
        setParamKeys: setParamKeys,
        setShortPath: setShortPath,
        setRank: setRank,
        addMetaChildren: addMetaChildren,
        setIsIndexable: setIsIndexable,
        assignRelations: assignRelations,
        assignIndex: assignIndex,
        assignLayout: assignLayout,
        createFlatList: createFlatList,
        setPrototype: setPrototype
    });

    const defaultNode = {
        "isDir": false,
        "ext": "svelte",
        "isLayout": false,
        "isReset": false,
        "isIndex": false,
        "isFallback": false,
        "isPage": false,
        "ownMeta": {},
        "meta": {
            "recursive": true,
            "preload": false,
            "prerender": true
        },
        "id": "__fallback",
    };

    function restoreDefaults(node) {
        Object.entries(defaultNode).forEach(([key, value]) => {
            if (typeof node[key] === 'undefined')
                node[key] = value;
        });
        
        if(node.children)
            node.children = node.children.map(restoreDefaults);

        return node
    }

    const assignAPI = createNodeMiddleware(({ file }) => {
        file.api = new ClientApi(file);
    });

    class ClientApi {
        constructor(file) {
            this.__file = file;
            Object.defineProperty(this, '__file', { enumerable: false });
            this.isMeta = !!file.isMeta;
            this.path = file.path;
            this.title = _prettyName(file);
            this.meta = file.meta;
        }

        get parent() { return !this.__file.root && this.__file.parent.api }
        get children() {
            return (this.__file.children || this.__file.isLayout && this.__file.parent.children || [])
                .filter(c => !c.isNonIndexable)
                .sort((a, b) => {
                    if (a.isMeta && b.isMeta) return 0
                    a = (a.meta.index || a.meta.title || a.path).toString();
                    b = (b.meta.index || b.meta.title || b.path).toString();
                    return a.localeCompare((b), undefined, { numeric: true, sensitivity: 'base' })
                })
                .map(({ api }) => api)
        }
        get next() { return _navigate(this, +1) }
        get prev() { return _navigate(this, -1) }
        async preload() {
            const filePromises = [...this.__file.layouts, this.__file]
                .map(file => file.component());
            await Promise.all(filePromises);
        }
        get component() {
            return this.__file.component ? //is file?
                this.__file.component()
                : this.__file.index ? //is dir with index?
                    this.__file.index.component()
                    : false
        }
    }

    function _navigate(node, direction) {
        if (!node.__file.root) {
            const siblings = node.parent.children;
            const index = siblings.indexOf(node);
            return node.parent.children[index + direction]
        }
    }


    function _prettyName(file) {
        if (typeof file.meta.title !== 'undefined') return file.meta.title
        else return (file.shortPath || file.path)
            .split('/')
            .pop()
            .replace(/-/g, ' ')
    }

    const plugins = {
      ...miscPlugins,
      restoreDefaults: ({ tree }) => restoreDefaults(tree),
      assignAPI
    };

    function buildClientTree(tree) {
      const order = [
        // all
        "restoreDefaults",
        // pages
        "setParamKeys", //pages only
        "setRegex", //pages only
        "setShortPath", //pages only
        "setRank", //pages only
        "assignLayout", //pages only,
        // all
        "setPrototype",
        "addMetaChildren",
        "assignRelations", //all (except meta components?)
        "setIsIndexable", //all
        "assignIndex", //all
        "assignAPI", //all
        // routes
        "createFlatList"
      ];

      const payload = { tree, routes: [] };
      for (let name of order) {
        // if plugin is a createNodeMiddleware, use the sync function
        const fn = plugins[name].sync || plugins[name];
        fn(payload);
      }
      return payload
    }

    //tree
    const _tree = {
      "name": "_layout",
      "filepath": "/_layout.svelte",
      "root": true,
      "ownMeta": {},
      "absolutePath": "/home/pi/website/src/pages/_layout.svelte",
      "children": [
        {
          "isFile": true,
          "isDir": false,
          "file": "_fallback.svelte",
          "filepath": "/_fallback.svelte",
          "name": "_fallback",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/pi/website/src/pages/_fallback.svelte",
          "importPath": "../src/pages/_fallback.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": true,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "recursive": true,
            "preload": false,
            "prerender": true
          },
          "path": "/_fallback",
          "id": "__fallback",
          "component": () => Promise.resolve().then(function () { return _fallback; }).then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "index.svelte",
          "filepath": "/index.svelte",
          "name": "index",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/pi/website/src/pages/index.svelte",
          "importPath": "../src/pages/index.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": true,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {
            "index": 10,
            "title": "home"
          },
          "meta": {
            "index": 10,
            "title": "home",
            "recursive": true,
            "preload": false,
            "prerender": true
          },
          "path": "/index",
          "id": "_index",
          "component": () => Promise.resolve().then(function () { return index; }).then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": true,
          "file": "_layout.svelte",
          "filepath": "/projects/_layout.svelte",
          "name": "_layout",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/pi/website/src/pages/projects/_layout.svelte",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "608-snoozio.md",
              "filepath": "/projects/608-snoozio.md",
              "name": "608-snoozio",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/pi/website/src/pages/projects/608-snoozio.md",
              "importPath": "../src/pages/projects/608-snoozio.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "frontmatter": {
                  "title": "6.08 Snooz.io",
                  "published": "2020-03-9",
                  "author": "raytran",
                  "thumbnail": "protochess1.png",
                  "summary": "The alarm clock that hurts you",
                  "layout": "blog",
                  "tags": "classwork, website, physical-object"
                },
                "recursive": true,
                "preload": false,
                "prerender": true
              },
              "path": "/projects/608-snoozio",
              "id": "_projects_608Snoozio",
              "component": () => Promise.resolve().then(function () { return _608Snoozio; }).then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "6031-crossword.md",
              "filepath": "/projects/6031-crossword.md",
              "name": "6031-crossword",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/pi/website/src/pages/projects/6031-crossword.md",
              "importPath": "../src/pages/projects/6031-crossword.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "frontmatter": {
                  "title": "6.031 Crossword Project",
                  "published": "2020-11-9",
                  "author": "raytran",
                  "thumbnail": "protochess1.png",
                  "summary": "Project for 6.031 Software Construction",
                  "layout": "blog",
                  "tags": "classwork, multiplayer, website"
                },
                "recursive": true,
                "preload": false,
                "prerender": true
              },
              "path": "/projects/6031-crossword",
              "id": "_projects_6031Crossword",
              "component": () => Promise.resolve().then(function () { return _6031Crossword; }).then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/projects/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "/home/pi/website/src/pages/projects/index.svelte",
              "importPath": "../src/pages/projects/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "recursive": true,
                "preload": false,
                "prerender": true
              },
              "path": "/projects/index",
              "id": "_projects_index",
              "component": () => Promise.resolve().then(function () { return index$1; }).then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "nerf-turret.md",
              "filepath": "/projects/nerf-turret.md",
              "name": "nerf-turret",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/pi/website/src/pages/projects/nerf-turret.md",
              "importPath": "../src/pages/projects/nerf-turret.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "frontmatter": {
                  "title": "Nerf Turret",
                  "published": "2021-01-1",
                  "author": "raytran",
                  "thumbnail": "turret.jpg",
                  "summary": "A robot turret",
                  "layout": "blog",
                  "tags": "personal, physical-object"
                },
                "recursive": true,
                "preload": false,
                "prerender": true
              },
              "path": "/projects/nerf-turret",
              "id": "_projects_nerfTurret",
              "component": () => Promise.resolve().then(function () { return nerfTurret; }).then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "protochess.md",
              "filepath": "/projects/protochess.md",
              "name": "protochess",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/pi/website/src/pages/projects/protochess.md",
              "importPath": "../src/pages/projects/protochess.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "frontmatter": {
                  "title": "Protochess.com",
                  "subtitle": "How to write a chess engine in 6 months.",
                  "published": "2020-06-3",
                  "author": "raytran",
                  "thumbnail": "protochess1.png",
                  "summary": "Online multiplayer chess website that lets you build custom pieces/boards. Written in Svelte + Rust.\n",
                  "layout": "blog",
                  "tags": "personal, multiplayer, website, webassembly, rust, svelte"
                },
                "recursive": true,
                "preload": false,
                "prerender": true
              },
              "path": "/projects/protochess",
              "id": "_projects_protochess",
              "component": () => Promise.resolve().then(function () { return protochess; }).then(m => m.default)
            }
          ],
          "isLayout": true,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "importPath": "../src/pages/projects/_layout.svelte",
          "ownMeta": {
            "index": 20
          },
          "meta": {
            "index": 20,
            "recursive": true,
            "preload": false,
            "prerender": true
          },
          "path": "/projects",
          "id": "_projects__layout",
          "component": () => Promise.resolve().then(function () { return _layout; }).then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": true,
          "file": "_layout.svelte",
          "filepath": "/timeline/_layout.svelte",
          "name": "_layout",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/pi/website/src/pages/timeline/_layout.svelte",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "index.md",
              "filepath": "/timeline/index.md",
              "name": "index",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/pi/website/src/pages/timeline/index.md",
              "importPath": "../src/pages/timeline/index.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "recursive": true,
                "preload": false,
                "prerender": true
              },
              "path": "/timeline/index",
              "id": "_timeline_index",
              "component": () => Promise.resolve().then(function () { return index$2; }).then(m => m.default)
            }
          ],
          "isLayout": true,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "importPath": "../src/pages/timeline/_layout.svelte",
          "ownMeta": {
            "index": 50
          },
          "meta": {
            "index": 50,
            "recursive": true,
            "preload": false,
            "prerender": true
          },
          "path": "/timeline",
          "id": "_timeline__layout",
          "component": () => Promise.resolve().then(function () { return _layout$1; }).then(m => m.default)
        }
      ],
      "isLayout": true,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "isPage": false,
      "isFile": true,
      "file": "_layout.svelte",
      "ext": "svelte",
      "badExt": false,
      "importPath": "../src/pages/_layout.svelte",
      "meta": {
        "recursive": true,
        "preload": false,
        "prerender": true
      },
      "path": "/",
      "id": "__layout",
      "component": () => Promise.resolve().then(function () { return _layout$2; }).then(m => m.default)
    };


    const {tree, routes: routes$1} = buildClientTree(_tree);

    /* src/App.svelte generated by Svelte v3.31.0 */

    function create_fragment$3(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes: routes$1 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes: routes$1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }
    App.$compile = {"vars":[{"name":"Router","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"routes","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    const app = HMR(App, { target: document.body }, "routify-app");

    /** Service worker. Uncomment to use service worker */

    // if ('serviceWorker' in navigator) {
    //     import('workbox-window').then(async ({ Workbox }) => {
    //         const wb = new Workbox('/sw.js')
    //         const registration = await wb.register()
    //         wb.addEventListener('installed', () => (console.log('installed service worker')))
    //         wb.addEventListener('externalinstalled', () => (console.log('installed service worker')))
    //     })
    // }

    /* src/pages/_fallback.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/pages/_fallback.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let a;
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "404";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Page not found. \n  \n  ");
    			a = element("a");
    			t3 = text("Go back");
    			attr_dev(div0, "class", "huge svelte-33l10e");
    			add_location(div0, file$2, 17, 2, 263);
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[0]("../"));
    			add_location(a, file$2, 20, 2, 386);
    			attr_dev(div1, "class", "big");
    			add_location(div1, file$2, 18, 2, 293);
    			attr_dev(div2, "class", "e404 svelte-33l10e");
    			add_location(div2, file$2, 16, 0, 242);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url*/ 1 && a_href_value !== (a_href_value = /*$url*/ ctx[0]("../"))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $url;
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fallback", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fallback> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ url, $url });
    	return [$url];
    }

    class Fallback extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fallback",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }
    Fallback.$compile = {"vars":[{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"$url","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    var _fallback = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Fallback
    });

    /* node_modules/svelte-fa/src/fa.svelte generated by Svelte v3.31.0 */

    const file$3 = "node_modules/svelte-fa/src/fa.svelte";

    // (104:0) {#if i[4]}
    function create_if_block$2(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let svg_viewBox_value;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[8][4] == "string") return create_if_block_1$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if_block.c();
    			attr_dev(g0, "transform", /*transform*/ ctx[10]);
    			add_location(g0, file$3, 116, 6, 2052);
    			attr_dev(g1, "transform", "translate(256 256)");
    			add_location(g1, file$3, 113, 4, 2000);
    			attr_dev(svg, "id", /*id*/ ctx[1]);
    			attr_dev(svg, "class", /*clazz*/ ctx[0]);
    			attr_dev(svg, "style", /*s*/ ctx[9]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = `0 0 ${/*i*/ ctx[8][0]} ${/*i*/ ctx[8][1]}`);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 104, 2, 1830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			if_block.m(g0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g0, null);
    				}
    			}

    			if (dirty & /*transform*/ 1024) {
    				attr_dev(g0, "transform", /*transform*/ ctx[10]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(svg, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*clazz*/ 1) {
    				attr_dev(svg, "class", /*clazz*/ ctx[0]);
    			}

    			if (dirty & /*s*/ 512) {
    				attr_dev(svg, "style", /*s*/ ctx[9]);
    			}

    			if (dirty & /*i*/ 256 && svg_viewBox_value !== (svg_viewBox_value = `0 0 ${/*i*/ ctx[8][0]} ${/*i*/ ctx[8][1]}`)) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(104:0) {#if i[4]}",
    		ctx
    	});

    	return block;
    }

    // (124:8) {:else}
    function create_else_block(ctx) {
    	let path0;
    	let path0_d_value;
    	let path0_fill_value;
    	let path0_fill_opacity_value;
    	let path1;
    	let path1_d_value;
    	let path1_fill_value;
    	let path1_fill_opacity_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", path0_d_value = /*i*/ ctx[8][4][0]);
    			attr_dev(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[4] || /*color*/ ctx[2] || "currentColor");

    			attr_dev(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*primaryOpacity*/ ctx[5]
    			: /*secondaryOpacity*/ ctx[6]);

    			attr_dev(path0, "transform", "translate(-256 -256)");
    			add_location(path0, file$3, 124, 10, 2286);
    			attr_dev(path1, "d", path1_d_value = /*i*/ ctx[8][4][1]);
    			attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[3] || /*color*/ ctx[2] || "currentColor");

    			attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*secondaryOpacity*/ ctx[6]
    			: /*primaryOpacity*/ ctx[5]);

    			attr_dev(path1, "transform", "translate(-256 -256)");
    			add_location(path1, file$3, 130, 10, 2529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, path1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 256 && path0_d_value !== (path0_d_value = /*i*/ ctx[8][4][0])) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*secondaryColor, color*/ 20 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[4] || /*color*/ ctx[2] || "currentColor")) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 224 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*primaryOpacity*/ ctx[5]
    			: /*secondaryOpacity*/ ctx[6])) {
    				attr_dev(path0, "fill-opacity", path0_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 256 && path1_d_value !== (path1_d_value = /*i*/ ctx[8][4][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*primaryColor, color*/ 12 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[3] || /*color*/ ctx[2] || "currentColor")) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 224 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[7] != false
    			? /*secondaryOpacity*/ ctx[6]
    			: /*primaryOpacity*/ ctx[5])) {
    				attr_dev(path1, "fill-opacity", path1_fill_opacity_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(path1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(124:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (118:8) {#if typeof i[4] == 'string'}
    function create_if_block_1$1(ctx) {
    	let path;
    	let path_d_value;
    	let path_fill_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "d", path_d_value = /*i*/ ctx[8][4]);
    			attr_dev(path, "fill", path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[3] || "currentColor");
    			attr_dev(path, "transform", "translate(-256 -256)");
    			add_location(path, file$3, 118, 10, 2116);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 256 && path_d_value !== (path_d_value = /*i*/ ctx[8][4])) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*color, primaryColor*/ 12 && path_fill_value !== (path_fill_value = /*color*/ ctx[2] || /*primaryColor*/ ctx[3] || "currentColor")) {
    				attr_dev(path, "fill", path_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(118:8) {#if typeof i[4] == 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[8][4] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*i*/ ctx[8][4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fa", slots, []);
    	let { class: clazz = "" } = $$props;
    	let { id = "" } = $$props;
    	let { style = "" } = $$props;
    	let { icon } = $$props;
    	let { fw = false } = $$props;
    	let { flip = false } = $$props;
    	let { pull = false } = $$props;
    	let { rotate = false } = $$props;
    	let { size = false } = $$props;
    	let { color = "" } = $$props;
    	let { primaryColor = "" } = $$props;
    	let { secondaryColor = "" } = $$props;
    	let { primaryOpacity = 1 } = $$props;
    	let { secondaryOpacity = 0.4 } = $$props;
    	let { swapOpacity = false } = $$props;
    	let i;
    	let s;
    	let transform;

    	const writable_props = [
    		"class",
    		"id",
    		"style",
    		"icon",
    		"fw",
    		"flip",
    		"pull",
    		"rotate",
    		"size",
    		"color",
    		"primaryColor",
    		"secondaryColor",
    		"primaryOpacity",
    		"secondaryOpacity",
    		"swapOpacity"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fa> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("class" in $$props) $$invalidate(0, clazz = $$props.class);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("style" in $$props) $$invalidate(11, style = $$props.style);
    		if ("icon" in $$props) $$invalidate(12, icon = $$props.icon);
    		if ("fw" in $$props) $$invalidate(13, fw = $$props.fw);
    		if ("flip" in $$props) $$invalidate(14, flip = $$props.flip);
    		if ("pull" in $$props) $$invalidate(15, pull = $$props.pull);
    		if ("rotate" in $$props) $$invalidate(16, rotate = $$props.rotate);
    		if ("size" in $$props) $$invalidate(17, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("primaryColor" in $$props) $$invalidate(3, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(4, secondaryColor = $$props.secondaryColor);
    		if ("primaryOpacity" in $$props) $$invalidate(5, primaryOpacity = $$props.primaryOpacity);
    		if ("secondaryOpacity" in $$props) $$invalidate(6, secondaryOpacity = $$props.secondaryOpacity);
    		if ("swapOpacity" in $$props) $$invalidate(7, swapOpacity = $$props.swapOpacity);
    	};

    	$$self.$capture_state = () => ({
    		clazz,
    		id,
    		style,
    		icon,
    		fw,
    		flip,
    		pull,
    		rotate,
    		size,
    		color,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform
    	});

    	$$self.$inject_state = $$props => {
    		if ("clazz" in $$props) $$invalidate(0, clazz = $$props.clazz);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("style" in $$props) $$invalidate(11, style = $$props.style);
    		if ("icon" in $$props) $$invalidate(12, icon = $$props.icon);
    		if ("fw" in $$props) $$invalidate(13, fw = $$props.fw);
    		if ("flip" in $$props) $$invalidate(14, flip = $$props.flip);
    		if ("pull" in $$props) $$invalidate(15, pull = $$props.pull);
    		if ("rotate" in $$props) $$invalidate(16, rotate = $$props.rotate);
    		if ("size" in $$props) $$invalidate(17, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("primaryColor" in $$props) $$invalidate(3, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(4, secondaryColor = $$props.secondaryColor);
    		if ("primaryOpacity" in $$props) $$invalidate(5, primaryOpacity = $$props.primaryOpacity);
    		if ("secondaryOpacity" in $$props) $$invalidate(6, secondaryOpacity = $$props.secondaryOpacity);
    		if ("swapOpacity" in $$props) $$invalidate(7, swapOpacity = $$props.swapOpacity);
    		if ("i" in $$props) $$invalidate(8, i = $$props.i);
    		if ("s" in $$props) $$invalidate(9, s = $$props.s);
    		if ("transform" in $$props) $$invalidate(10, transform = $$props.transform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 4096) {
    			 $$invalidate(8, i = icon && icon.icon || [0, 0, "", [], ""]);
    		}

    		if ($$self.$$.dirty & /*fw, pull, size, style*/ 174080) {
    			 {
    				let float;
    				let width;
    				const height = "1em";
    				let lineHeight;
    				let fontSize;
    				let textAlign;
    				let verticalAlign = "-.125em";
    				const overflow = "visible";

    				if (fw) {
    					textAlign = "center";
    					width = "1.25em";
    				}

    				if (pull) {
    					float = pull;
    				}

    				if (size) {
    					if (size == "lg") {
    						fontSize = "1.33333em";
    						lineHeight = ".75em";
    						verticalAlign = "-.225em";
    					} else if (size == "xs") {
    						fontSize = ".75em";
    					} else if (size == "sm") {
    						fontSize = ".875em";
    					} else {
    						fontSize = size.replace("x", "em");
    					}
    				}

    				const styleObj = {
    					float,
    					width,
    					height,
    					"line-height": lineHeight,
    					"font-size": fontSize,
    					"text-align": textAlign,
    					"vertical-align": verticalAlign,
    					overflow
    				};

    				let styleStr = "";

    				for (const prop in styleObj) {
    					if (styleObj[prop]) {
    						styleStr += `${prop}:${styleObj[prop]};`;
    					}
    				}

    				$$invalidate(9, s = styleStr + style);
    			}
    		}

    		if ($$self.$$.dirty & /*flip, rotate*/ 81920) {
    			 {
    				let t = "";

    				if (flip) {
    					let flipX = 1;
    					let flipY = 1;

    					if (flip == "horizontal") {
    						flipX = -1;
    					} else if (flip == "vertical") {
    						flipY = -1;
    					} else {
    						flipX = flipY = -1;
    					}

    					t += ` scale(${flipX} ${flipY})`;
    				}

    				if (rotate) {
    					t += ` rotate(${rotate} 0 0)`;
    				}

    				$$invalidate(10, transform = t);
    			}
    		}
    	};

    	return [
    		clazz,
    		id,
    		color,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		s,
    		transform,
    		style,
    		icon,
    		fw,
    		flip,
    		pull,
    		rotate,
    		size
    	];
    }

    class Fa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			class: 0,
    			id: 1,
    			style: 11,
    			icon: 12,
    			fw: 13,
    			flip: 14,
    			pull: 15,
    			rotate: 16,
    			size: 17,
    			color: 2,
    			primaryColor: 3,
    			secondaryColor: 4,
    			primaryOpacity: 5,
    			secondaryOpacity: 6,
    			swapOpacity: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fa",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[12] === undefined && !("icon" in props)) {
    			console.warn("<Fa> was created without expected prop 'icon'");
    		}
    	}

    	get class() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fw() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fw(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pull() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pull(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get swapOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set swapOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    Fa.$compile = {"vars":[{"name":"clazz","export_name":"class","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"id","export_name":"id","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"style","export_name":"style","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"icon","export_name":"icon","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"fw","export_name":"fw","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"flip","export_name":"flip","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"pull","export_name":"pull","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"rotate","export_name":"rotate","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"size","export_name":"size","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"color","export_name":"color","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"primaryColor","export_name":"primaryColor","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"secondaryColor","export_name":"secondaryColor","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"primaryOpacity","export_name":"primaryOpacity","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"secondaryOpacity","export_name":"secondaryOpacity","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"swapOpacity","export_name":"swapOpacity","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"i","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"s","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"transform","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true}]};

    /* src/components/Card.svelte generated by Svelte v3.31.0 */

    const file$4 = "src/components/Card.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "card svelte-86jmqy");
    			add_location(div, file$4, 9, 0, 202);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }
    Card.$compile = {"vars":[]};

    /*!
     * Font Awesome Free 5.15.2 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     */
    var faFacebook = {
      prefix: 'fab',
      iconName: 'facebook',
      icon: [512, 512, [], "f09a", "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"]
    };
    var faGithub = {
      prefix: 'fab',
      iconName: 'github',
      icon: [496, 512, [], "f09b", "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"]
    };
    var faInstagram = {
      prefix: 'fab',
      iconName: 'instagram',
      icon: [448, 512, [], "f16d", "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"]
    };
    var faLinkedin = {
      prefix: 'fab',
      iconName: 'linkedin',
      icon: [448, 512, [], "f08c", "M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"]
    };

    /* src/pages/index.svelte generated by Svelte v3.31.0 */
    const file$5 = "src/pages/index.svelte";

    // (110:0) <Card>
    function create_default_slot$1(ctx) {
    	let div7;
    	let img;
    	let img_src_value;
    	let t0;
    	let div6;
    	let div0;
    	let t1;
    	let b;
    	let t3;
    	let br;
    	let t4;
    	let a0;
    	let t6;
    	let t7;
    	let div5;
    	let div1;
    	let a1;
    	let fa0;
    	let t8;
    	let div2;
    	let a2;
    	let fa1;
    	let t9;
    	let div3;
    	let a3;
    	let fa2;
    	let t10;
    	let div4;
    	let a4;
    	let fa3;
    	let current;

    	fa0 = new Fa({
    			props: { size: "2x", icon: faGithub },
    			$$inline: true
    		});

    	fa1 = new Fa({
    			props: { size: "2x", icon: faInstagram },
    			$$inline: true
    		});

    	fa2 = new Fa({
    			props: { size: "2x", icon: faFacebook },
    			$$inline: true
    		});

    	fa3 = new Fa({
    			props: { size: "2x", icon: faLinkedin },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			img = element("img");
    			t0 = space();
    			div6 = element("div");
    			div0 = element("div");
    			t1 = text("Hi, my name is ");
    			b = element("b");
    			b.textContent = "Raymond Tran";
    			t3 = text(".");
    			br = element("br");
    			t4 = text("\n\tI'm a sophomore at MIT majoring in Electrical Engineering & Computer Science.\n\tHere is my ");
    			a0 = element("a");
    			a0.textContent = "resume";
    			t6 = text(".");
    			t7 = space();
    			div5 = element("div");
    			div1 = element("div");
    			a1 = element("a");
    			create_component(fa0.$$.fragment);
    			t8 = space();
    			div2 = element("div");
    			a2 = element("a");
    			create_component(fa1.$$.fragment);
    			t9 = space();
    			div3 = element("div");
    			a3 = element("a");
    			create_component(fa2.$$.fragment);
    			t10 = space();
    			div4 = element("div");
    			a4 = element("a");
    			create_component(fa3.$$.fragment);
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "alt", "raytran-logo");
    			if (img.src !== (img_src_value = "/images/raytran_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1cidtth");
    			add_location(img, file$5, 111, 4, 1798);
    			add_location(b, file$5, 115, 16, 1914);
    			add_location(br, file$5, 115, 36, 1934);
    			set_style(a0, "color", "blue");
    			attr_dev(a0, "href", "https://drive.google.com/file/d/1ZYyUQ5egN5oHIuxHjoMIhimj27dHf3Nf/view?usp=sharing");
    			add_location(a0, file$5, 117, 12, 2030);
    			add_location(div0, file$5, 114, 6, 1892);
    			attr_dev(a1, "href", "https://github.com/raytran");
    			add_location(a1, file$5, 121, 3, 2218);
    			attr_dev(div1, "class", "icon svelte-1cidtth");
    			add_location(div1, file$5, 120, 1, 2196);
    			attr_dev(a2, "href", "https://instagram.com/rayt.ran");
    			add_location(a2, file$5, 126, 3, 2332);
    			attr_dev(div2, "class", "icon svelte-1cidtth");
    			add_location(div2, file$5, 125, 1, 2310);
    			attr_dev(a3, "href", "https://www.facebook.com/raymond.tran.3158/");
    			add_location(a3, file$5, 131, 3, 2453);
    			attr_dev(div3, "class", "icon svelte-1cidtth");
    			add_location(div3, file$5, 130, 1, 2431);
    			attr_dev(a4, "href", "https://www.linkedin.com/in/raymondtran120/");
    			add_location(a4, file$5, 136, 3, 2586);
    			attr_dev(div4, "class", "icon svelte-1cidtth");
    			add_location(div4, file$5, 135, 1, 2564);
    			attr_dev(div5, "id", "icon-links");
    			attr_dev(div5, "class", "svelte-1cidtth");
    			add_location(div5, file$5, 119, 6, 2173);
    			attr_dev(div6, "id", "intro");
    			attr_dev(div6, "class", "svelte-1cidtth");
    			add_location(div6, file$5, 112, 4, 1868);
    			attr_dev(div7, "id", "main_wrapper");
    			attr_dev(div7, "class", "svelte-1cidtth");
    			add_location(div7, file$5, 110, 2, 1770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, img);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, t1);
    			append_dev(div0, b);
    			append_dev(div0, t3);
    			append_dev(div0, br);
    			append_dev(div0, t4);
    			append_dev(div0, a0);
    			append_dev(div0, t6);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, a1);
    			mount_component(fa0, a1, null);
    			append_dev(div5, t8);
    			append_dev(div5, div2);
    			append_dev(div2, a2);
    			mount_component(fa1, a2, null);
    			append_dev(div5, t9);
    			append_dev(div5, div3);
    			append_dev(div3, a3);
    			mount_component(fa2, a3, null);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, a4);
    			mount_component(fa3, a4, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa0.$$.fragment, local);
    			transition_in(fa1.$$.fragment, local);
    			transition_in(fa2.$$.fragment, local);
    			transition_in(fa3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa0.$$.fragment, local);
    			transition_out(fa1.$$.fragment, local);
    			transition_out(fa2.$$.fragment, local);
    			transition_out(fa3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(fa0);
    			destroy_component(fa1);
    			destroy_component(fa2);
    			destroy_component(fa3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(110:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(card.$$.fragment);
    			attr_dev(div0, "id", "outer_wrapper");
    			attr_dev(div0, "class", "svelte-1cidtth");
    			add_location(div0, file$5, 108, 0, 1736);
    			attr_dev(div1, "id", "center_wrapper");
    			attr_dev(div1, "class", "svelte-1cidtth");
    			add_location(div1, file$5, 107, 0, 1710);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(card, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pages", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pages> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Fa,
    		Card,
    		faInstagram,
    		faFacebook,
    		faLinkedin,
    		faGithub
    	});

    	return [];
    }

    class Pages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pages",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }
    Pages.$compile = {"vars":[{"name":"Fa","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"Card","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"faInstagram","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"faFacebook","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"faLinkedin","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"faGithub","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Pages
    });

    /* src/components/ProjectPage.svelte generated by Svelte v3.31.0 */
    const file$6 = "src/components/ProjectPage.svelte";

    // (5:0) <Card>
    function create_default_slot$2(ctx) {
    	let a0;
    	let t1;
    	let t2;
    	let a1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[0].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "Back to All Projects";
    			t1 = space();
    			if (default_slot) default_slot.c();
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "Back to All Projects";
    			attr_dev(a0, "href", "/projects");
    			add_location(a0, file$6, 5, 4, 69);
    			attr_dev(a1, "href", "/projects");
    			add_location(a1, file$6, 7, 4, 130);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, a1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(5:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectPage", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Card });
    	return [slots, $$scope];
    }

    class ProjectPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectPage",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }
    ProjectPage.$compile = {"vars":[{"name":"Card","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    /* src/pages/projects/608-snoozio.md generated by Svelte v3.31.0 */
    const file$7 = "src/pages/projects/608-snoozio.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "In the 2020 Fall semester, I took 6.031 Software Construction. This class covers the essential topics in software engineering, including unit testing, rigorous documentation, etc.";
    			add_location(p, file$7, 10, 0, 495);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new ProjectPage({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata = {
    	"title": "6.08 Snooz.io",
    	"published": "2020-03-9",
    	"author": "raytran",
    	"thumbnail": "protochess1.png",
    	"summary": "The alarm clock that hurts you",
    	"layout": "blog",
    	"tags": "classwork, website, physical-object"
    };

    const { title, published, author, thumbnail, summary, layout: layout$1, tags } = metadata;

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_608_snoozio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_608_snoozio> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata,
    		title,
    		published,
    		author,
    		thumbnail,
    		summary,
    		layout: layout$1,
    		tags,
    		Layout_MDSVEX_DEFAULT: ProjectPage
    	});

    	return [];
    }

    class _608_snoozio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_608_snoozio",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }
    _608_snoozio.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"published","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"author","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"thumbnail","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"tags","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var _608Snoozio = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _608_snoozio,
        metadata: metadata
    });

    /* src/pages/projects/6031-crossword.md generated by Svelte v3.31.0 */
    const file$8 = "src/pages/projects/6031-crossword.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "In the 2020 Fall semester, I took 6.031 Software Construction. This class covers the essential topics in software engineering, including unit testing, rigorous documentation, etc.";
    			add_location(p, file$8, 10, 0, 510);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$1];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new ProjectPage({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$1)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$1 = {
    	"title": "6.031 Crossword Project",
    	"published": "2020-11-9",
    	"author": "raytran",
    	"thumbnail": "protochess1.png",
    	"summary": "Project for 6.031 Software Construction",
    	"layout": "blog",
    	"tags": "classwork, multiplayer, website"
    };

    const { title: title$1, published: published$1, author: author$1, thumbnail: thumbnail$1, summary: summary$1, layout: layout$2, tags: tags$1 } = metadata$1;

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_6031_crossword", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_6031_crossword> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$1,
    		title: title$1,
    		published: published$1,
    		author: author$1,
    		thumbnail: thumbnail$1,
    		summary: summary$1,
    		layout: layout$2,
    		tags: tags$1,
    		Layout_MDSVEX_DEFAULT: ProjectPage
    	});

    	return [];
    }

    class _6031_crossword extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_6031_crossword",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }
    _6031_crossword.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"published","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"author","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"thumbnail","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"tags","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var _6031Crossword = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _6031_crossword,
        metadata: metadata$1
    });

    var lib = ["#eee", "#d6e685", "#8cc665", "#44a340", "#1e6823"];

    var colorLegend = lib;

    var GH_FILL_LEVELS = ["day", "day-L1", "day-L4", "day-L3", "day-L2"];

    /**
     * parseGitHubCalendarSvg
     * Parses the SVG input (as string).
     *
     * @name parseGitHubCalendarSvg
     * @function
     * @param {String} input The SVG code of the contributions calendar.
     * @return {Object} An object containing:
     *
     *  - `last_year` (Number): The total contributions in the last year.
     *  - `longest_streak` (Number): The longest streak.
     *  - `longest_streak_range` (Array): An array of two date objects representing the date range.
     *  - `current_streak` (Number): The current streak.
     *  - `current_streak_range` (Array): An array of two date objects representing the date range.
     *  - `days` (Array): An array of day objects:
     *       - `fill` (String): The hex color.
     *       - `date` (Date): The day date.
     *       - `count` (Number): The number of commits.
     *       - `level` (Number): A number between 0 and 4 (inclusive) representing the contribution level (more commits, higher value).
     *  - `weeks` (Array): The day objects grouped by weeks (arrays).
     *  - `last_contributed` (Date): The last contribution date.
     */
    var lib$1 = function parseGitHubCalendarSvg(input) {

        var data = {
            last_year: 0,
            longest_streak: -1,
            longest_streak_range: [],
            current_streak: 0,
            current_streak_range: [],
            weeks: [],
            days: [],
            last_contributed: null
        },
            lastWeek = [],
            updateLongestStreak = function updateLongestStreak() {
            if (data.current_streak > data.longest_streak) {
                data.longest_streak = data.current_streak;
                data.longest_streak_range[0] = data.current_streak_range[0];
                data.longest_streak_range[1] = data.current_streak_range[1];
            }
        };

        input.split("\n").slice(2).map(function (c) {
            return c.trim();
        }).forEach(function (c) {
            if (c.startsWith("<g transform")) {
                return lastWeek.length && data.weeks.push(lastWeek) && (lastWeek = []);
            }

            var fill = c.match(/fill="var\(\-\-color\-calendar\-graph\-([a-z0-9-]+)\-bg\)"/i),
                date = c.match(/data-date="([0-9\-]+)"/),
                count = c.match(/data-count="([0-9]+)"/);

            fill = fill && fill[1];
            date = date && date[1];
            count = count && +count[1];

            if (!fill) {
                return;
            }

            fill = colorLegend[GH_FILL_LEVELS.indexOf(fill)];

            var obj = {
                fill: fill,
                date: new Date(date),
                count: count,
                level: lib.indexOf(fill)
            };

            if (data.current_streak === 0) {
                data.current_streak_range[0] = obj.date;
            }

            if (obj.count) {
                ++data.current_streak;
                data.last_year += obj.count;
                data.last_contributed = obj.date;
                data.current_streak_range[1] = obj.date;
            } else {
                updateLongestStreak();
                data.current_streak = 0;
            }

            lastWeek.push(obj);
            data.days.push(obj);
        });

        updateLongestStreak();

        return data;
    };

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    /**
     * iterateObject
     * Iterates an object. Note the object field order may differ.
     *
     * @name iterateObject
     * @function
     * @param {Object} obj The input object.
     * @param {Function} fn A function that will be called with the current value, field name and provided object.
     * @return {Function} The `iterateObject` function.
     */
    function iterateObject(obj, fn) {
        var i = 0,
            keys = [];

        if (Array.isArray(obj)) {
            for (; i < obj.length; ++i) {
                if (fn(obj[i], i, obj) === false) {
                    break;
                }
            }
        } else if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object" && obj !== null) {
            keys = Object.keys(obj);
            for (; i < keys.length; ++i) {
                if (fn(obj[keys[i]], keys[i], obj) === false) {
                    break;
                }
            }
        }
    }

    var lib$2 = iterateObject;

    /**
     * An Array.prototype.slice.call(arguments) alternative
     *
     * @param {Object} args something with a length
     * @param {Number} slice
     * @param {Number} sliceEnd
     * @api public
     */

    var sliced = function (args, slice, sliceEnd) {
      var ret = [];
      var len = args.length;

      if (0 === len) return ret;

      var start = slice < 0
        ? Math.max(0, slice + len)
        : slice || 0;

      if (sliceEnd !== undefined) {
        len = sliceEnd < 0
          ? sliceEnd + len
          : sliceEnd;
      }

      while (len-- > start) {
        ret[len - start] = args[len];
      }

      return ret;
    };

    /**
     * elly
     * Selects the DOM elements based on the provided selector. If there is no
     * commonjs/module environment, the `$` global variable will be created.
     *
     * @name elly
     * @function
     * @param {String|HTMLElement} input The element selector (e.g.
     * `'#my-id > .my-class'`), the element tag you want to create
     * (e.g. `'<ul>'`) or the HTML element (will be returned by the function).
     * @param {Object|HTMLElement} contextOrAttributes
     * @returns {HTMLElement} The HTMLElement that was provided or selected.
     */
    function $(input, contextOrAttributes) {
        if (typeof input === "string") {
            if (input.charAt(0) === "<") {
                input = document.createElement(input.slice(1, -1));
                lib$2(contextOrAttributes || {}, function (value, name) {

                    switch (name) {
                        case "text":
                            input.textContent = value;
                            return;
                        case "html":
                            input.innerHTML = value;
                            return;
                    }

                    input.setAttribute(name, value);
                });
                return input;
            } else {
                contextOrAttributes = contextOrAttributes || document;
                return contextOrAttributes.querySelector(input);
            }
        }
        return input;
    }
    /**
     * elly.$$
     * Selects multiple elements. Note that if there is no commonjs/module environment, you will access this function using `$.$$`.
     *
     * @name elly.$$
     * @function
     * @param {String} selector The DOM query selector.
     * @param {HTMLElement} context The element context/container. Defaults to `document`.
     * @returns {Array} The array of elements.
     */
    $.$$ = function (selector, context) {
        if (typeof selector === "string") {
            context = context || document;
            return sliced(context.querySelectorAll(selector));
        }
        return [selector];
    };

    var lib$3 = $;

    function gen(add) {
        return function _(d, count, what) {
            count = add * count;
            switch (what) {
                case "years":
                case "year":
                    d.setFullYear(d.getFullYear() + count);
                    break;
                case "months":
                case "month":
                    d.setMonth(d.getMonth() + count);
                    break;
                case "weeks":
                case "week":
                    return _(d, count * 7, "days");
                case "days":
                case "day":
                    d.setDate(d.getDate() + count);
                    break;
                case "hours":
                case "hour":
                    d.setHours(d.getHours() + count);
                    break;
                case "minutes":
                case "minute":
                    d.setMinutes(d.getMinutes() + count);
                    break;
                case "seconds":
                case "second":
                    d.setSeconds(d.getSeconds() + count);
                    break;
                case "milliseconds":
                case "millisecond":
                    d.setMilliseconds(d.getMilliseconds() + count);
                    break;
                default:
                    throw new Error("Invalid range: " + what);
            }
            return d;
        };
    }

    var lib$4 = {
        add: gen(1),
        subtract: gen(-1)
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var months = createCommonjsModule(function (module) {
    /*!
     * months <https://github.com/datetime/months>
     *
     * Copyright (c) 2014-2017, Jon Schlinkert.
     * Released under the MIT License.
     */

    // English Translation
    module.exports = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    module.exports.abbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Italian Translation
    module.exports.it = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    module.exports.abbr.it = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    // German Translation
    module.exports.de = [ 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    module.exports.abbr.de = [ 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez' ];
    });

    var days = createCommonjsModule(function (module) {
    /*!
     * days <https://github.com/jonschlinkert/days>
     *
     * Copyright (c) 2014-2017, Jon Schlinkert.
     * Released under the MIT License.
     */

    // English
    module.exports.en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    module.exports.en.abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    module.exports.en.short = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // French translation
    module.exports.fr = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    module.exports.fr.abbr = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    module.exports.fr.short = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];

    // Spanish translation
    module.exports.es = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    module.exports.es.abbr = ['dom', 'lun', 'mar', 'mir', 'jue', 'vie', 'sab'];
    module.exports.es.short = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'];

    // Italian translation
    module.exports.it = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];
    module.exports.it.abbr = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    module.exports.it.short = ['D', 'L', 'Ma', 'Me', 'G', 'V', 'S'];

    // In order not to break compatibility
    module.exports = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    module.exports.abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    module.exports.short = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    });

    /**
     * fillo
     * Fill additional characters at the beginning of the string.
     *
     * @name fillo
     * @function
     * @param {String|Number} what The input snippet (number, string or anything that can be stringified).
     * @param {Number} size The width of the final string (default: `2`).
     * @param {String} ch The character to repeat (default: `"0"`).
     * @return {String} The input value with filled characters.
     */
    var lib$5 = function fillo(what, size, ch) {
      size = size || 2;
      ch = ch || "0";
      what = what.toString();
      var howMany = size - what.length;
      return (howMany <= 0 ? "" : ch.repeat(howMany)) + what;
    };

    /**
     * RegexEscape
     * Escapes a string for using it in a regular expression.
     *
     * @name RegexEscape
     * @function
     * @param {String} input The string that must be escaped.
     * @return {String} The escaped string.
     */
    function RegexEscape(input) {
      return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    /**
     * proto
     * Adds the `RegexEscape` function to `RegExp` class.
     *
     * @name proto
     * @function
     * @return {Function} The `RegexEscape` function.
     */
    RegexEscape.proto = function () {
      RegExp.escape = RegexEscape;
      return RegexEscape;
    };

    var lib$6 = RegexEscape;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }



    var ParseIt = function () {
        /**
         * ParseIt
         * The `ParseIt` class. It can be used to use the same data object but with different formats/arguments.
         *
         * @name ParseIt
         * @function
         * @param {Object} obj An object containing the fields to replace.
         */
        function ParseIt(obj) {
            _classCallCheck(this, ParseIt);

            this.obj = obj || {};
            this.re = new RegExp("^(" + Object.keys(obj).map(lib$6).join("|") + ")");
        }

        /**
         * run
         * Replaces the fields in the format string with data coming from the data object.
         *
         *
         * @name parseIt
         * @function
         * @param {String} format The format input.
         * @param {Array} args An array of arguments to be passed to the replace function (stored in the `obj` object).
         * @return {String} The result as string.
         */


        _createClass(ParseIt, [{
            key: "run",
            value: function run(format, args) {
                var result = "";
                args = args || [];
                do {
                    var arr = format.match(this.re),
                        field = arr && arr[1],
                        c = field || format.charAt(0);

                    if (field) {
                        var value = this.obj[field];
                        if (typeof value === "function") {
                            value = value.apply(this, args);
                        }
                        result += value;
                    } else {
                        result += c;
                    }
                    format = format.substring(c.length);
                } while (format);
                return result;
            }
        }]);

        return ParseIt;
    }();

    /**
     * parseIt
     * A wrapper around the `ParseIt` class. The `ParseIt` constructor is accessible using `parseIt.Parser`.
     *
     * @name parseIt
     * @function
     * @param {String} format The format input.
     * @param {Object} obj An object containing the fields to replace.
     * @param {Array} args An array of arguments to be passed to the replace function (stored in the `obj` object).
     * @return {String} The result as string.
     */


    function parseIt(format, obj, args) {
        return new ParseIt(obj).run(format, args);
    }

    parseIt.Parser = ParseIt;

    var lib$7 = parseIt;

    var ParseIt$1 = lib$7.Parser;

    var rules = {
        // Years
        /// 2015
        YYYY: function YYYY(i, utc) {
            if (utc) {
                return i.getUTCFullYear();
            }
            return i.getFullYear();
        }

        // 15
        ,
        YY: function YY(i, utc) {
            return rules.YYYY(i, utc) % 100;
        }

        // Months
        // January
        ,
        MMMM: function MMMM(i, utc) {
            if (utc) {
                return months[i.getUTCMonth()];
            }
            return months[i.getMonth()];
        }

        // Jan
        ,
        MMM: function MMM(i, utc) {
            if (utc) {
                return months.abbr[i.getUTCMonth()];
            }
            return months.abbr[i.getMonth()];
        }

        // 01
        ,
        MM: function MM(i, utc) {
            if (utc) {
                return lib$5(i.getUTCMonth() + 1);
            }
            return lib$5(i.getMonth() + 1);
        }

        // 1
        ,
        M: function M(i, utc) {
            if (utc) {
                return i.getUTCMonth() + 1;
            }
            return i.getMonth() + 1;
        }

        // Days
        // Sunday
        ,
        dddd: function dddd(i, utc) {
            return days[rules.d(i, utc)];
        }

        // Sun
        ,
        ddd: function ddd(i, utc) {
            return days.abbr[rules.d(i, utc)];
        }

        // Su
        ,
        dd: function dd(i, utc) {
            return days.short[rules.d(i, utc)];
        }

        // 0
        ,
        d: function d(i, utc) {
            if (utc) {
                return i.getUTCDay();
            }
            return i.getDay();
        }

        // Dates
        // 06  Day in month
        ,
        DD: function DD(i, utc) {
            return lib$5(rules.D(i, utc));
        }

        // 6   Day in month
        ,
        D: function D(i, utc) {
            if (utc) {
                return i.getUTCDate();
            }
            return i.getDate();
        }

        // AM/PM
        // AM/PM
        ,
        A: function A(i, utc) {
            return rules.a(i, utc).toUpperCase();
        }

        // am/pm
        ,
        a: function a(i, utc) {
            return rules.H(i, utc) >= 12 ? "pm" : "am";
        }

        // Hours
        // 08 Hour
        ,
        hh: function hh(i, utc) {
            return lib$5(rules.h(i, utc));
        }

        // 8 Hour
        ,
        h: function h(i, utc) {
            return rules.H(i, utc) % 12 || 12;
        }

        // (alias)
        ,
        HH: function HH(i, utc) {
            return lib$5(rules.H(i, utc));
        }

        // (alias)
        ,
        H: function H(i, utc) {
            if (utc) {
                return i.getUTCHours();
            }
            return i.getHours();
        }

        // Minutes
        // 09 Minute
        ,
        mm: function mm(i, utc) {
            return lib$5(rules.m(i, utc));
        }

        // 9  Minute
        ,
        m: function m(i, utc) {
            if (utc) {
                return i.getUTCMinutes();
            }
            return i.getMinutes();
        }

        // Seconds
        // 09 Seconds
        ,
        ss: function ss(i, utc) {
            return lib$5(rules.s(i, utc));
        }

        // 9  Seconds
        ,
        s: function s(i, utc) {
            if (utc) {
                return i.getUTCSeconds();
            }
            return i.getSeconds();
        }

        // Fractional seconds
        // 0 1 ... 8 9
        ,
        S: function S(i, utc) {
            return Math.round(rules.s(i, utc) / 60 * 10);
        },
        SS: function SS(i, utc) {
            return lib$5(rules.s(i, utc) / 60 * 100);
        },
        SSS: function SSS(i, utc) {
            return lib$5(rules.s(i, utc) / 60 * 1000, 3);
        }

        // Timezones
        ,
        Z: function Z(i) {
            var offset = -i.getTimezoneOffset();
            return (offset >= 0 ? "+" : "-") + lib$5(parseInt(offset / 60)) + ":" + lib$5(offset % 60);
        },
        ZZ: function ZZ(i) {
            var offset = -i.getTimezoneOffset();
            return (offset >= 0 ? "+" : "-") + lib$5(parseInt(offset / 60)) + lib$5(offset % 60);
        }
    };

    var parser = new ParseIt$1(rules);

    /**
     * formatoid
     * Formats the date into a given format.
     *
     * Usable format fields:
     *
     *  - **Years**
     *      - `YYYY` (e.g. `"2015"`)
     *      - `YY` (e.g. `"15"`)
     *  - **Months**
     *      - `MMMM` (e.g. `"January"`)
     *      - `MMM` (e.g. `"Jan"`)
     *      - `MM` (e.g. `"01"`)
     *      - `M` (e.g. `"1"`)
     *  - **Days**
     *      - `dddd` (e.g. `"Sunday"`)
     *      - `ddd` (e.g. `"Sun"`)
     *      - `dd` (e.g. `"Su"`)
     *      - `d` (e.g. `"Su"`)
     *  - **Dates**
     *      - `DD` (e.g. `"07"`)
     *      - `D` (e.g. `"7"`)
     *  - **AM/PM**
     *      - `A` (e.g. `"AM"`)
     *      - `a` (e.g. `"pm"`)
     *  - **Hours**
     *      - `hh` (e.g. `"07"`)–12 hour format
     *      - `h` (e.g. `"7"`)
     *      - `HH` (e.g. `"07"`)–24 hour format
     *      - `H` (e.g. `"7"`)
     *  - **Minutes**
     *      - `mm` (e.g. `"07"`)
     *      - `m` (e.g. `"7"`)
     *  - **Seconds**
     *      - `ss` (e.g. `"07"`)
     *      - `s` (e.g. `"7"`)
     *  - **Fractional seconds**
     *      - `S` (e.g. `0 1 2 3 ... 9`)
     *      - `SS` (e.g. `00 01 02 ... 98 99`)
     *      - `SS` (e.g. `000 001 002 ... 998 999`)
     *  - **Timezones**
     *      - `Z` (e.g. `-07:00 -06:00 ... +06:00 +07:00`)
     *      - `ZZ` (e.g. `-0700 -0600 ... +0600 +0700`)
     *
     * @name formatoid
     * @function
     * @param {Date} i The date object.
     * @param {String} f The date format.
     * @return {String} The formatted date (as string).
     */
    var lib$8 = function formatoid(i, f) {
        return parser.run(f, [i, i._useUTC]);
    };

    var DATE_FORMAT1 = "MMM D, YYYY",
        DATE_FORMAT2 = "MMMM D";

    var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function printDayCount(dayCount) {
        return dayCount + " " + (dayCount === 1 ? "day" : "days");
    }

    function addTooltips(container) {
        var tooltip = document.createElement("div");
        tooltip.classList.add("day-tooltip");
        container.appendChild(tooltip);

        // Add mouse event listener to show & hide tooltip
        var days = container.querySelectorAll("rect.day");
        days.forEach(function (day) {
            day.addEventListener("mouseenter", function (e) {
                var contribCount = e.target.getAttribute("data-count");
                if (contribCount === "0") {
                    contribCount = "No contributions";
                } else if (contribCount === "1") {
                    contribCount = "1 contribution";
                } else {
                    contribCount = contribCount + " contributions";
                }
                var date = new Date(e.target.getAttribute("data-date"));
                var dateText = MONTH_NAMES[date.getUTCMonth()] + " " + date.getUTCDate() + ", " + date.getUTCFullYear();
                tooltip.innerHTML = "<strong>" + contribCount + "</strong> on " + dateText;
                tooltip.classList.add("is-visible");
                var size = e.target.getBoundingClientRect(),
                    leftPos = size.left + window.pageXOffset - tooltip.offsetWidth / 2 + size.width / 2,
                    topPos = size.bottom + window.pageYOffset - tooltip.offsetHeight - 2 * size.height;
                tooltip.style.top = topPos + "px";
                tooltip.style.left = leftPos + "px";
            });
            day.addEventListener("mouseleave", function () {
                tooltip.classList.remove("is-visible");
            });
        });
    }

    /**
     * GitHubCalendar
     * Brings the contributions calendar from GitHub (provided username) into your page.
     *
     * @name GitHubCalendar
     * @function
     * @param {String|HTMLElement} container The calendar container (query selector or the element itself).
     * @param {String} username The GitHub username.
     * @param {Object} options An object containing the following fields:
     *
     *    - `summary_text` (String): The text that appears under the calendar (defaults to: `"Summary of
     *      pull requests, issues opened, and commits made by <username>"`).
     *    - `proxy` (Function): A function that receives as argument the username (string) and should return a promise resolving the HTML content of the contributions page.
     *      The default is using @Bloggify's APIs.
     *    - `global_stats` (Boolean): If `false`, the global stats (total, longest and current streaks) will not be calculated and displayed. By default this is enabled.
     *    - `responsive` (Boolean): If `true`, the graph is changed to scale with the container. Custom CSS should be applied to the element to scale it appropriately. By default this is disabled.
     *    - `tooltips` (Boolean): If `true`, tooltips will be shown when hovered over calendar days. By default this is disabled.
     *    - `cache` (Number) The cache time in seconds.
     *
     * @return {Promise} A promise returned by the `fetch()` call.
     */
    var lib$9 = function GitHubCalendar(container, username, options) {

        container = lib$3(container);

        options = options || {};
        options.summary_text = options.summary_text || "Summary of pull requests, issues opened, and commits made by <a href=\"https://github.com/" + username + "\" target=\"blank\">@" + username + "</a>";
        options.cache = (options.cache || 24 * 60 * 60) * 1000;

        if (options.global_stats === false) {
            container.style.minHeight = "175px";
        }

        var cacheKeys = {
            content: "gh_calendar_content." + username,
            expire_at: "gh_calendar_expire." + username

            // We need a proxy for CORS
        };options.proxy = options.proxy || function (username) {
            return fetch("https://api.bloggify.net/gh-calendar/?username=" + username).then(function (r) {
                return r.text();
            });
        };

        options.getCalendar = options.getCalendar || function (username) {
            if (options.cache && Date.now() < +localStorage.getItem(cacheKeys.expire_at)) {
                var content = localStorage.getItem(cacheKeys.content);
                if (content) {
                    return Promise.resolve(content);
                }
            }

            return options.proxy(username).then(function (body) {
                if (options.cache) {
                    localStorage.setItem(cacheKeys.content, body);
                    localStorage.setItem(cacheKeys.expire_at, Date.now() + options.cache);
                }
                return body;
            });
        };

        var fetchCalendar = function fetchCalendar() {
            return options.getCalendar(username).then(function (body) {
                var div = document.createElement("div");
                div.innerHTML = body;
                var cal = div.querySelector(".js-yearly-contributions");
                lib$3(".position-relative h2", cal).remove();
                cal.querySelector(".float-left.text-gray").innerHTML = options.summary_text;

                // If 'include-fragment' with spinner img loads instead of the svg, fetchCalendar again
                if (cal.querySelector("include-fragment")) {
                    setTimeout(fetchCalendar, 500);
                } else {
                    // If options includes responsive, SVG element has to be manipulated to be made responsive
                    if (options.responsive === true) {
                        var svg = cal.querySelector("svg.js-calendar-graph-svg");
                        // Get the width/height properties and use them to create the viewBox
                        var width = svg.getAttribute("width");
                        var height = svg.getAttribute("height");
                        // Remove height property entirely
                        svg.removeAttribute("height");
                        // Width property should be set to 100% to fill entire container
                        svg.setAttribute("width", "100%");
                        // Add a viewBox property based on the former width/height
                        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
                    }

                    if (options.global_stats !== false) {
                        var parsed = lib$1(lib$3("svg", cal).outerHTML),
                            currentStreakInfo = parsed.current_streak ? lib$8(parsed.current_streak_range[0], DATE_FORMAT2) + " &ndash; " + lib$8(parsed.current_streak_range[1], DATE_FORMAT2) : parsed.last_contributed ? "Last contributed in " + lib$8(parsed.last_contributed, DATE_FORMAT2) + "." : "Rock - Hard Place",
                            longestStreakInfo = parsed.longest_streak ? lib$8(parsed.longest_streak_range[0], DATE_FORMAT2) + " &ndash; " + lib$8(parsed.longest_streak_range[1], DATE_FORMAT2) : parsed.last_contributed ? "Last contributed in " + lib$8(parsed.last_contributed, DATE_FORMAT2) + "." : "Rock - Hard Place",
                            firstCol = lib$3("<div>", {
                            "class": "contrib-column contrib-column-first table-column",
                            html: "<span class=\"text-muted\">Contributions in the last year</span>\n                               <span class=\"contrib-number\">" + parsed.last_year + " total</span>\n                               <span class=\"text-muted\">" + lib$8(lib$4.add(lib$4.subtract(new Date(), 1, "year"), 1, "day"), DATE_FORMAT1) + " &ndash; " + lib$8(new Date(), DATE_FORMAT1) + "</span>"
                        }),
                            secondCol = lib$3("<div>", {
                            "class": "contrib-column table-column",
                            html: "<span class=\"text-muted\">Longest streak</span>\n                               <span class=\"contrib-number\">" + printDayCount(parsed.longest_streak) + "</span>\n                               <span class=\"text-muted\">" + longestStreakInfo + "</span>"
                        }),
                            thirdCol = lib$3("<div>", {
                            "class": "contrib-column table-column",
                            html: "<span class=\"text-muted\">Current streak</span>\n                               <span class=\"contrib-number\">" + printDayCount(parsed.current_streak) + "</span>\n                               <span class=\"text-muted\">" + currentStreakInfo + "</span>"
                        });

                        cal.appendChild(firstCol);
                        cal.appendChild(secondCol);
                        cal.appendChild(thirdCol);
                    }

                    container.innerHTML = cal.innerHTML;

                    // If options includes tooltips, add tooltips listeners to SVG
                    if (options.tooltips === true) {
                        addTooltips(container);
                    }
                }
            }).catch(function (e) {
                return console.error(e);
            });
        };

        return fetchCalendar();
    };

    var marked = createCommonjsModule(function (module, exports) {
    /**
     * marked - a markdown parser
     * Copyright (c) 2011-2020, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/markedjs/marked
     */

    /**
     * DO NOT EDIT THIS FILE
     * The code in this file is generated from files in ./src/
     */

    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, (function () {
      function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
      }

      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }

      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;

        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

        return arr2;
      }

      function _createForOfIteratorHelperLoose(o, allowArrayLike) {
        var it;

        if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
          if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            return function () {
              if (i >= o.length) return {
                done: true
              };
              return {
                done: false,
                value: o[i++]
              };
            };
          }

          throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }

        it = o[Symbol.iterator]();
        return it.next.bind(it);
      }

      function createCommonjsModule(fn, module) {
      	return module = { exports: {} }, fn(module, module.exports), module.exports;
      }

      var defaults = createCommonjsModule(function (module) {
        function getDefaults() {
          return {
            baseUrl: null,
            breaks: false,
            gfm: true,
            headerIds: true,
            headerPrefix: '',
            highlight: null,
            langPrefix: 'language-',
            mangle: true,
            pedantic: false,
            renderer: null,
            sanitize: false,
            sanitizer: null,
            silent: false,
            smartLists: false,
            smartypants: false,
            tokenizer: null,
            walkTokens: null,
            xhtml: false
          };
        }

        function changeDefaults(newDefaults) {
          module.exports.defaults = newDefaults;
        }

        module.exports = {
          defaults: getDefaults(),
          getDefaults: getDefaults,
          changeDefaults: changeDefaults
        };
      });
      var defaults_1 = defaults.defaults;
      var defaults_2 = defaults.getDefaults;
      var defaults_3 = defaults.changeDefaults;

      /**
       * Helpers
       */
      var escapeTest = /[&<>"']/;
      var escapeReplace = /[&<>"']/g;
      var escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
      var escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
      var escapeReplacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };

      var getEscapeReplacement = function getEscapeReplacement(ch) {
        return escapeReplacements[ch];
      };

      function escape(html, encode) {
        if (encode) {
          if (escapeTest.test(html)) {
            return html.replace(escapeReplace, getEscapeReplacement);
          }
        } else {
          if (escapeTestNoEncode.test(html)) {
            return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
          }
        }

        return html;
      }

      var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

      function unescape(html) {
        // explicitly match decimal, hex, and named HTML entities
        return html.replace(unescapeTest, function (_, n) {
          n = n.toLowerCase();
          if (n === 'colon') return ':';

          if (n.charAt(0) === '#') {
            return n.charAt(1) === 'x' ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
          }

          return '';
        });
      }

      var caret = /(^|[^\[])\^/g;

      function edit(regex, opt) {
        regex = regex.source || regex;
        opt = opt || '';
        var obj = {
          replace: function replace(name, val) {
            val = val.source || val;
            val = val.replace(caret, '$1');
            regex = regex.replace(name, val);
            return obj;
          },
          getRegex: function getRegex() {
            return new RegExp(regex, opt);
          }
        };
        return obj;
      }

      var nonWordAndColonTest = /[^\w:]/g;
      var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

      function cleanUrl(sanitize, base, href) {
        if (sanitize) {
          var prot;

          try {
            prot = decodeURIComponent(unescape(href)).replace(nonWordAndColonTest, '').toLowerCase();
          } catch (e) {
            return null;
          }

          if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
            return null;
          }
        }

        if (base && !originIndependentUrl.test(href)) {
          href = resolveUrl(base, href);
        }

        try {
          href = encodeURI(href).replace(/%25/g, '%');
        } catch (e) {
          return null;
        }

        return href;
      }

      var baseUrls = {};
      var justDomain = /^[^:]+:\/*[^/]*$/;
      var protocol = /^([^:]+:)[\s\S]*$/;
      var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

      function resolveUrl(base, href) {
        if (!baseUrls[' ' + base]) {
          // we can ignore everything in base after the last slash of its path component,
          // but we might need to add _that_
          // https://tools.ietf.org/html/rfc3986#section-3
          if (justDomain.test(base)) {
            baseUrls[' ' + base] = base + '/';
          } else {
            baseUrls[' ' + base] = rtrim(base, '/', true);
          }
        }

        base = baseUrls[' ' + base];
        var relativeBase = base.indexOf(':') === -1;

        if (href.substring(0, 2) === '//') {
          if (relativeBase) {
            return href;
          }

          return base.replace(protocol, '$1') + href;
        } else if (href.charAt(0) === '/') {
          if (relativeBase) {
            return href;
          }

          return base.replace(domain, '$1') + href;
        } else {
          return base + href;
        }
      }

      var noopTest = {
        exec: function noopTest() {}
      };

      function merge(obj) {
        var i = 1,
            target,
            key;

        for (; i < arguments.length; i++) {
          target = arguments[i];

          for (key in target) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
              obj[key] = target[key];
            }
          }
        }

        return obj;
      }

      function splitCells(tableRow, count) {
        // ensure that every cell-delimiting pipe has a space
        // before it to distinguish it from an escaped pipe
        var row = tableRow.replace(/\|/g, function (match, offset, str) {
          var escaped = false,
              curr = offset;

          while (--curr >= 0 && str[curr] === '\\') {
            escaped = !escaped;
          }

          if (escaped) {
            // odd number of slashes means | is escaped
            // so we leave it alone
            return '|';
          } else {
            // add space before unescaped |
            return ' |';
          }
        }),
            cells = row.split(/ \|/);
        var i = 0;

        if (cells.length > count) {
          cells.splice(count);
        } else {
          while (cells.length < count) {
            cells.push('');
          }
        }

        for (; i < cells.length; i++) {
          // leading or trailing whitespace is ignored per the gfm spec
          cells[i] = cells[i].trim().replace(/\\\|/g, '|');
        }

        return cells;
      } // Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
      // /c*$/ is vulnerable to REDOS.
      // invert: Remove suffix of non-c chars instead. Default falsey.


      function rtrim(str, c, invert) {
        var l = str.length;

        if (l === 0) {
          return '';
        } // Length of suffix matching the invert condition.


        var suffLen = 0; // Step left until we fail to match the invert condition.

        while (suffLen < l) {
          var currChar = str.charAt(l - suffLen - 1);

          if (currChar === c && !invert) {
            suffLen++;
          } else if (currChar !== c && invert) {
            suffLen++;
          } else {
            break;
          }
        }

        return str.substr(0, l - suffLen);
      }

      function findClosingBracket(str, b) {
        if (str.indexOf(b[1]) === -1) {
          return -1;
        }

        var l = str.length;
        var level = 0,
            i = 0;

        for (; i < l; i++) {
          if (str[i] === '\\') {
            i++;
          } else if (str[i] === b[0]) {
            level++;
          } else if (str[i] === b[1]) {
            level--;

            if (level < 0) {
              return i;
            }
          }
        }

        return -1;
      }

      function checkSanitizeDeprecation(opt) {
        if (opt && opt.sanitize && !opt.silent) {
          console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
        }
      } // copied from https://stackoverflow.com/a/5450113/806777


      function repeatString(pattern, count) {
        if (count < 1) {
          return '';
        }

        var result = '';

        while (count > 1) {
          if (count & 1) {
            result += pattern;
          }

          count >>= 1;
          pattern += pattern;
        }

        return result + pattern;
      }

      var helpers = {
        escape: escape,
        unescape: unescape,
        edit: edit,
        cleanUrl: cleanUrl,
        resolveUrl: resolveUrl,
        noopTest: noopTest,
        merge: merge,
        splitCells: splitCells,
        rtrim: rtrim,
        findClosingBracket: findClosingBracket,
        checkSanitizeDeprecation: checkSanitizeDeprecation,
        repeatString: repeatString
      };

      var defaults$1 = defaults.defaults;
      var rtrim$1 = helpers.rtrim,
          splitCells$1 = helpers.splitCells,
          _escape = helpers.escape,
          findClosingBracket$1 = helpers.findClosingBracket;

      function outputLink(cap, link, raw) {
        var href = link.href;
        var title = link.title ? _escape(link.title) : null;
        var text = cap[1].replace(/\\([\[\]])/g, '$1');

        if (cap[0].charAt(0) !== '!') {
          return {
            type: 'link',
            raw: raw,
            href: href,
            title: title,
            text: text
          };
        } else {
          return {
            type: 'image',
            raw: raw,
            href: href,
            title: title,
            text: _escape(text)
          };
        }
      }

      function indentCodeCompensation(raw, text) {
        var matchIndentToCode = raw.match(/^(\s+)(?:```)/);

        if (matchIndentToCode === null) {
          return text;
        }

        var indentToCode = matchIndentToCode[1];
        return text.split('\n').map(function (node) {
          var matchIndentInNode = node.match(/^\s+/);

          if (matchIndentInNode === null) {
            return node;
          }

          var indentInNode = matchIndentInNode[0];

          if (indentInNode.length >= indentToCode.length) {
            return node.slice(indentToCode.length);
          }

          return node;
        }).join('\n');
      }
      /**
       * Tokenizer
       */


      var Tokenizer_1 = /*#__PURE__*/function () {
        function Tokenizer(options) {
          this.options = options || defaults$1;
        }

        var _proto = Tokenizer.prototype;

        _proto.space = function space(src) {
          var cap = this.rules.block.newline.exec(src);

          if (cap) {
            if (cap[0].length > 1) {
              return {
                type: 'space',
                raw: cap[0]
              };
            }

            return {
              raw: '\n'
            };
          }
        };

        _proto.code = function code(src, tokens) {
          var cap = this.rules.block.code.exec(src);

          if (cap) {
            var lastToken = tokens[tokens.length - 1]; // An indented code block cannot interrupt a paragraph.

            if (lastToken && lastToken.type === 'paragraph') {
              return {
                raw: cap[0],
                text: cap[0].trimRight()
              };
            }

            var text = cap[0].replace(/^ {4}/gm, '');
            return {
              type: 'code',
              raw: cap[0],
              codeBlockStyle: 'indented',
              text: !this.options.pedantic ? rtrim$1(text, '\n') : text
            };
          }
        };

        _proto.fences = function fences(src) {
          var cap = this.rules.block.fences.exec(src);

          if (cap) {
            var raw = cap[0];
            var text = indentCodeCompensation(raw, cap[3] || '');
            return {
              type: 'code',
              raw: raw,
              lang: cap[2] ? cap[2].trim() : cap[2],
              text: text
            };
          }
        };

        _proto.heading = function heading(src) {
          var cap = this.rules.block.heading.exec(src);

          if (cap) {
            return {
              type: 'heading',
              raw: cap[0],
              depth: cap[1].length,
              text: cap[2]
            };
          }
        };

        _proto.nptable = function nptable(src) {
          var cap = this.rules.block.nptable.exec(src);

          if (cap) {
            var item = {
              type: 'table',
              header: splitCells$1(cap[1].replace(/^ *| *\| *$/g, '')),
              align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
              cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : [],
              raw: cap[0]
            };

            if (item.header.length === item.align.length) {
              var l = item.align.length;
              var i;

              for (i = 0; i < l; i++) {
                if (/^ *-+: *$/.test(item.align[i])) {
                  item.align[i] = 'right';
                } else if (/^ *:-+: *$/.test(item.align[i])) {
                  item.align[i] = 'center';
                } else if (/^ *:-+ *$/.test(item.align[i])) {
                  item.align[i] = 'left';
                } else {
                  item.align[i] = null;
                }
              }

              l = item.cells.length;

              for (i = 0; i < l; i++) {
                item.cells[i] = splitCells$1(item.cells[i], item.header.length);
              }

              return item;
            }
          }
        };

        _proto.hr = function hr(src) {
          var cap = this.rules.block.hr.exec(src);

          if (cap) {
            return {
              type: 'hr',
              raw: cap[0]
            };
          }
        };

        _proto.blockquote = function blockquote(src) {
          var cap = this.rules.block.blockquote.exec(src);

          if (cap) {
            var text = cap[0].replace(/^ *> ?/gm, '');
            return {
              type: 'blockquote',
              raw: cap[0],
              text: text
            };
          }
        };

        _proto.list = function list(src) {
          var cap = this.rules.block.list.exec(src);

          if (cap) {
            var raw = cap[0];
            var bull = cap[2];
            var isordered = bull.length > 1;
            var list = {
              type: 'list',
              raw: raw,
              ordered: isordered,
              start: isordered ? +bull.slice(0, -1) : '',
              loose: false,
              items: []
            }; // Get each top-level item.

            var itemMatch = cap[0].match(this.rules.block.item);
            var next = false,
                item,
                space,
                bcurr,
                bnext,
                addBack,
                loose,
                istask,
                ischecked;
            var l = itemMatch.length;
            bcurr = this.rules.block.listItemStart.exec(itemMatch[0]);

            for (var i = 0; i < l; i++) {
              item = itemMatch[i];
              raw = item; // Determine whether the next list item belongs here.
              // Backpedal if it does not belong in this list.

              if (i !== l - 1) {
                bnext = this.rules.block.listItemStart.exec(itemMatch[i + 1]);

                if (bnext[1].length > bcurr[0].length || bnext[1].length > 3) {
                  // nested list
                  itemMatch.splice(i, 2, itemMatch[i] + '\n' + itemMatch[i + 1]);
                  i--;
                  l--;
                  continue;
                } else {
                  if ( // different bullet style
                  !this.options.pedantic || this.options.smartLists ? bnext[2][bnext[2].length - 1] !== bull[bull.length - 1] : isordered === (bnext[2].length === 1)) {
                    addBack = itemMatch.slice(i + 1).join('\n');
                    list.raw = list.raw.substring(0, list.raw.length - addBack.length);
                    i = l - 1;
                  }
                }

                bcurr = bnext;
              } // Remove the list item's bullet
              // so it is seen as the next token.


              space = item.length;
              item = item.replace(/^ *([*+-]|\d+[.)]) ?/, ''); // Outdent whatever the
              // list item contains. Hacky.

              if (~item.indexOf('\n ')) {
                space -= item.length;
                item = !this.options.pedantic ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '') : item.replace(/^ {1,4}/gm, '');
              } // Determine whether item is loose or not.
              // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
              // for discount behavior.


              loose = next || /\n\n(?!\s*$)/.test(item);

              if (i !== l - 1) {
                next = item.charAt(item.length - 1) === '\n';
                if (!loose) loose = next;
              }

              if (loose) {
                list.loose = true;
              } // Check for task list items


              if (this.options.gfm) {
                istask = /^\[[ xX]\] /.test(item);
                ischecked = undefined;

                if (istask) {
                  ischecked = item[1] !== ' ';
                  item = item.replace(/^\[[ xX]\] +/, '');
                }
              }

              list.items.push({
                type: 'list_item',
                raw: raw,
                task: istask,
                checked: ischecked,
                loose: loose,
                text: item
              });
            }

            return list;
          }
        };

        _proto.html = function html(src) {
          var cap = this.rules.block.html.exec(src);

          if (cap) {
            return {
              type: this.options.sanitize ? 'paragraph' : 'html',
              raw: cap[0],
              pre: !this.options.sanitizer && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
              text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : _escape(cap[0]) : cap[0]
            };
          }
        };

        _proto.def = function def(src) {
          var cap = this.rules.block.def.exec(src);

          if (cap) {
            if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
            var tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
            return {
              tag: tag,
              raw: cap[0],
              href: cap[2],
              title: cap[3]
            };
          }
        };

        _proto.table = function table(src) {
          var cap = this.rules.block.table.exec(src);

          if (cap) {
            var item = {
              type: 'table',
              header: splitCells$1(cap[1].replace(/^ *| *\| *$/g, '')),
              align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
              cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
            };

            if (item.header.length === item.align.length) {
              item.raw = cap[0];
              var l = item.align.length;
              var i;

              for (i = 0; i < l; i++) {
                if (/^ *-+: *$/.test(item.align[i])) {
                  item.align[i] = 'right';
                } else if (/^ *:-+: *$/.test(item.align[i])) {
                  item.align[i] = 'center';
                } else if (/^ *:-+ *$/.test(item.align[i])) {
                  item.align[i] = 'left';
                } else {
                  item.align[i] = null;
                }
              }

              l = item.cells.length;

              for (i = 0; i < l; i++) {
                item.cells[i] = splitCells$1(item.cells[i].replace(/^ *\| *| *\| *$/g, ''), item.header.length);
              }

              return item;
            }
          }
        };

        _proto.lheading = function lheading(src) {
          var cap = this.rules.block.lheading.exec(src);

          if (cap) {
            return {
              type: 'heading',
              raw: cap[0],
              depth: cap[2].charAt(0) === '=' ? 1 : 2,
              text: cap[1]
            };
          }
        };

        _proto.paragraph = function paragraph(src) {
          var cap = this.rules.block.paragraph.exec(src);

          if (cap) {
            return {
              type: 'paragraph',
              raw: cap[0],
              text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1]
            };
          }
        };

        _proto.text = function text(src, tokens) {
          var cap = this.rules.block.text.exec(src);

          if (cap) {
            var lastToken = tokens[tokens.length - 1];

            if (lastToken && lastToken.type === 'text') {
              return {
                raw: cap[0],
                text: cap[0]
              };
            }

            return {
              type: 'text',
              raw: cap[0],
              text: cap[0]
            };
          }
        };

        _proto.escape = function escape(src) {
          var cap = this.rules.inline.escape.exec(src);

          if (cap) {
            return {
              type: 'escape',
              raw: cap[0],
              text: _escape(cap[1])
            };
          }
        };

        _proto.tag = function tag(src, inLink, inRawBlock) {
          var cap = this.rules.inline.tag.exec(src);

          if (cap) {
            if (!inLink && /^<a /i.test(cap[0])) {
              inLink = true;
            } else if (inLink && /^<\/a>/i.test(cap[0])) {
              inLink = false;
            }

            if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              inRawBlock = true;
            } else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              inRawBlock = false;
            }

            return {
              type: this.options.sanitize ? 'text' : 'html',
              raw: cap[0],
              inLink: inLink,
              inRawBlock: inRawBlock,
              text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : _escape(cap[0]) : cap[0]
            };
          }
        };

        _proto.link = function link(src) {
          var cap = this.rules.inline.link.exec(src);

          if (cap) {
            var lastParenIndex = findClosingBracket$1(cap[2], '()');

            if (lastParenIndex > -1) {
              var start = cap[0].indexOf('!') === 0 ? 5 : 4;
              var linkLen = start + cap[1].length + lastParenIndex;
              cap[2] = cap[2].substring(0, lastParenIndex);
              cap[0] = cap[0].substring(0, linkLen).trim();
              cap[3] = '';
            }

            var href = cap[2];
            var title = '';

            if (this.options.pedantic) {
              var link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

              if (link) {
                href = link[1];
                title = link[3];
              } else {
                title = '';
              }
            } else {
              title = cap[3] ? cap[3].slice(1, -1) : '';
            }

            href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
            var token = outputLink(cap, {
              href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
              title: title ? title.replace(this.rules.inline._escapes, '$1') : title
            }, cap[0]);
            return token;
          }
        };

        _proto.reflink = function reflink(src, links) {
          var cap;

          if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
            var link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
            link = links[link.toLowerCase()];

            if (!link || !link.href) {
              var text = cap[0].charAt(0);
              return {
                type: 'text',
                raw: text,
                text: text
              };
            }

            var token = outputLink(cap, link, cap[0]);
            return token;
          }
        };

        _proto.strong = function strong(src, maskedSrc, prevChar) {
          if (prevChar === void 0) {
            prevChar = '';
          }

          var match = this.rules.inline.strong.start.exec(src);

          if (match && (!match[1] || match[1] && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar)))) {
            maskedSrc = maskedSrc.slice(-1 * src.length);
            var endReg = match[0] === '**' ? this.rules.inline.strong.endAst : this.rules.inline.strong.endUnd;
            endReg.lastIndex = 0;
            var cap;

            while ((match = endReg.exec(maskedSrc)) != null) {
              cap = this.rules.inline.strong.middle.exec(maskedSrc.slice(0, match.index + 3));

              if (cap) {
                return {
                  type: 'strong',
                  raw: src.slice(0, cap[0].length),
                  text: src.slice(2, cap[0].length - 2)
                };
              }
            }
          }
        };

        _proto.em = function em(src, maskedSrc, prevChar) {
          if (prevChar === void 0) {
            prevChar = '';
          }

          var match = this.rules.inline.em.start.exec(src);

          if (match && (!match[1] || match[1] && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar)))) {
            maskedSrc = maskedSrc.slice(-1 * src.length);
            var endReg = match[0] === '*' ? this.rules.inline.em.endAst : this.rules.inline.em.endUnd;
            endReg.lastIndex = 0;
            var cap;

            while ((match = endReg.exec(maskedSrc)) != null) {
              cap = this.rules.inline.em.middle.exec(maskedSrc.slice(0, match.index + 2));

              if (cap) {
                return {
                  type: 'em',
                  raw: src.slice(0, cap[0].length),
                  text: src.slice(1, cap[0].length - 1)
                };
              }
            }
          }
        };

        _proto.codespan = function codespan(src) {
          var cap = this.rules.inline.code.exec(src);

          if (cap) {
            var text = cap[2].replace(/\n/g, ' ');
            var hasNonSpaceChars = /[^ ]/.test(text);
            var hasSpaceCharsOnBothEnds = text.startsWith(' ') && text.endsWith(' ');

            if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
              text = text.substring(1, text.length - 1);
            }

            text = _escape(text, true);
            return {
              type: 'codespan',
              raw: cap[0],
              text: text
            };
          }
        };

        _proto.br = function br(src) {
          var cap = this.rules.inline.br.exec(src);

          if (cap) {
            return {
              type: 'br',
              raw: cap[0]
            };
          }
        };

        _proto.del = function del(src) {
          var cap = this.rules.inline.del.exec(src);

          if (cap) {
            return {
              type: 'del',
              raw: cap[0],
              text: cap[2]
            };
          }
        };

        _proto.autolink = function autolink(src, mangle) {
          var cap = this.rules.inline.autolink.exec(src);

          if (cap) {
            var text, href;

            if (cap[2] === '@') {
              text = _escape(this.options.mangle ? mangle(cap[1]) : cap[1]);
              href = 'mailto:' + text;
            } else {
              text = _escape(cap[1]);
              href = text;
            }

            return {
              type: 'link',
              raw: cap[0],
              text: text,
              href: href,
              tokens: [{
                type: 'text',
                raw: text,
                text: text
              }]
            };
          }
        };

        _proto.url = function url(src, mangle) {
          var cap;

          if (cap = this.rules.inline.url.exec(src)) {
            var text, href;

            if (cap[2] === '@') {
              text = _escape(this.options.mangle ? mangle(cap[0]) : cap[0]);
              href = 'mailto:' + text;
            } else {
              // do extended autolink path validation
              var prevCapZero;

              do {
                prevCapZero = cap[0];
                cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
              } while (prevCapZero !== cap[0]);

              text = _escape(cap[0]);

              if (cap[1] === 'www.') {
                href = 'http://' + text;
              } else {
                href = text;
              }
            }

            return {
              type: 'link',
              raw: cap[0],
              text: text,
              href: href,
              tokens: [{
                type: 'text',
                raw: text,
                text: text
              }]
            };
          }
        };

        _proto.inlineText = function inlineText(src, inRawBlock, smartypants) {
          var cap = this.rules.inline.text.exec(src);

          if (cap) {
            var text;

            if (inRawBlock) {
              text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : _escape(cap[0]) : cap[0];
            } else {
              text = _escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
            }

            return {
              type: 'text',
              raw: cap[0],
              text: text
            };
          }
        };

        return Tokenizer;
      }();

      var noopTest$1 = helpers.noopTest,
          edit$1 = helpers.edit,
          merge$1 = helpers.merge;
      /**
       * Block-Level Grammar
       */

      var block = {
        newline: /^\n+/,
        code: /^( {4}[^\n]+\n*)+/,
        fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
        hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
        heading: /^ {0,3}(#{1,6}) +([^\n]*?)(?: +#+)? *(?:\n+|$)/,
        blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
        list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?! {0,3}bull )\n*|\s*$)/,
        html: '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
        + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
        + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
        + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
        + ')',
        def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
        nptable: noopTest$1,
        table: noopTest$1,
        lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
        // regex template, placeholders will be replaced according to different paragraph
        // interruption rules of commonmark and the original markdown spec:
        _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html)[^\n]+)*)/,
        text: /^[^\n]+/
      };
      block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
      block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
      block.def = edit$1(block.def).replace('label', block._label).replace('title', block._title).getRegex();
      block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
      block.item = /^( *)(bull) ?[^\n]*(?:\n(?! *bull ?)[^\n]*)*/;
      block.item = edit$1(block.item, 'gm').replace(/bull/g, block.bullet).getRegex();
      block.listItemStart = edit$1(/^( *)(bull)/).replace('bull', block.bullet).getRegex();
      block.list = edit$1(block.list).replace(/bull/g, block.bullet).replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))').replace('def', '\\n+(?=' + block.def.source + ')').getRegex();
      block._tag = 'address|article|aside|base|basefont|blockquote|body|caption' + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption' + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe' + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option' + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr' + '|track|ul';
      block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
      block.html = edit$1(block.html, 'i').replace('comment', block._comment).replace('tag', block._tag).replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
      block.paragraph = edit$1(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
      .replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
      .getRegex();
      block.blockquote = edit$1(block.blockquote).replace('paragraph', block.paragraph).getRegex();
      /**
       * Normal Block Grammar
       */

      block.normal = merge$1({}, block);
      /**
       * GFM Block Grammar
       */

      block.gfm = merge$1({}, block.normal, {
        nptable: '^ *([^|\\n ].*\\|.*)\\n' // Header
        + ' {0,3}([-:]+ *\\|[-| :]*)' // Align
        + '(?:\\n((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)',
        // Cells
        table: '^ *\\|(.+)\\n' // Header
        + ' {0,3}\\|?( *[-:]+[-| :]*)' // Align
        + '(?:\\n *((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells

      });
      block.gfm.nptable = edit$1(block.gfm.nptable).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
      .getRegex();
      block.gfm.table = edit$1(block.gfm.table).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
      .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
      .getRegex();
      /**
       * Pedantic grammar (original John Gruber's loose markdown specification)
       */

      block.pedantic = merge$1({}, block.normal, {
        html: edit$1('^ *(?:comment *(?:\\n|\\s*$)' + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
        + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))').replace('comment', block._comment).replace(/tag/g, '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub' + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)' + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b').getRegex(),
        def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
        heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
        fences: noopTest$1,
        // fences not supported
        paragraph: edit$1(block.normal._paragraph).replace('hr', block.hr).replace('heading', ' *#{1,6} *[^\n]').replace('lheading', block.lheading).replace('blockquote', ' {0,3}>').replace('|fences', '').replace('|list', '').replace('|html', '').getRegex()
      });
      /**
       * Inline-Level Grammar
       */

      var inline = {
        escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
        autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
        url: noopTest$1,
        tag: '^comment' + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
        + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
        + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
        + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
        + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>',
        // CDATA section
        link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
        reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
        nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
        reflinkSearch: 'reflink|nolink(?!\\()',
        strong: {
          start: /^(?:(\*\*(?=[*punctuation]))|\*\*)(?![\s])|__/,
          // (1) returns if starts w/ punctuation
          middle: /^\*\*(?:(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)|\*(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)*?\*)+?\*\*$|^__(?![\s])((?:(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)|_(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)*?_)+?)__$/,
          endAst: /[^punctuation\s]\*\*(?!\*)|[punctuation]\*\*(?!\*)(?:(?=[punctuation_\s]|$))/,
          // last char can't be punct, or final * must also be followed by punct (or endline)
          endUnd: /[^\s]__(?!_)(?:(?=[punctuation*\s])|$)/ // last char can't be a space, and final _ must preceed punct or \s (or endline)

        },
        em: {
          start: /^(?:(\*(?=[punctuation]))|\*)(?![*\s])|_/,
          // (1) returns if starts w/ punctuation
          middle: /^\*(?:(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)|\*(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)*?\*)+?\*$|^_(?![_\s])(?:(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)|_(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)*?_)+?_$/,
          endAst: /[^punctuation\s]\*(?!\*)|[punctuation]\*(?!\*)(?:(?=[punctuation_\s]|$))/,
          // last char can't be punct, or final * must also be followed by punct (or endline)
          endUnd: /[^\s]_(?!_)(?:(?=[punctuation*\s])|$)/ // last char can't be a space, and final _ must preceed punct or \s (or endline)

        },
        code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
        br: /^( {2,}|\\)\n(?!\s*$)/,
        del: noopTest$1,
        text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n)))/,
        punctuation: /^([\s*punctuation])/
      }; // list of punctuation marks from common mark spec
      // without * and _ to workaround cases with double emphasis

      inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
      inline.punctuation = edit$1(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex(); // sequences em should skip over [title](link), `code`, <html>

      inline._blockSkip = '\\[[^\\]]*?\\]\\([^\\)]*?\\)|`[^`]*?`|<[^>]*?>';
      inline._overlapSkip = '__[^_]*?__|\\*\\*\\[^\\*\\]*?\\*\\*';
      inline._comment = edit$1(block._comment).replace('(?:-->|$)', '-->').getRegex();
      inline.em.start = edit$1(inline.em.start).replace(/punctuation/g, inline._punctuation).getRegex();
      inline.em.middle = edit$1(inline.em.middle).replace(/punctuation/g, inline._punctuation).replace(/overlapSkip/g, inline._overlapSkip).getRegex();
      inline.em.endAst = edit$1(inline.em.endAst, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
      inline.em.endUnd = edit$1(inline.em.endUnd, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
      inline.strong.start = edit$1(inline.strong.start).replace(/punctuation/g, inline._punctuation).getRegex();
      inline.strong.middle = edit$1(inline.strong.middle).replace(/punctuation/g, inline._punctuation).replace(/overlapSkip/g, inline._overlapSkip).getRegex();
      inline.strong.endAst = edit$1(inline.strong.endAst, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
      inline.strong.endUnd = edit$1(inline.strong.endUnd, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
      inline.blockSkip = edit$1(inline._blockSkip, 'g').getRegex();
      inline.overlapSkip = edit$1(inline._overlapSkip, 'g').getRegex();
      inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
      inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
      inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
      inline.autolink = edit$1(inline.autolink).replace('scheme', inline._scheme).replace('email', inline._email).getRegex();
      inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
      inline.tag = edit$1(inline.tag).replace('comment', inline._comment).replace('attribute', inline._attribute).getRegex();
      inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
      inline._href = /<(?:\\[<>]?|[^\s<>\\])*>|[^\s\x00-\x1f]*/;
      inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
      inline.link = edit$1(inline.link).replace('label', inline._label).replace('href', inline._href).replace('title', inline._title).getRegex();
      inline.reflink = edit$1(inline.reflink).replace('label', inline._label).getRegex();
      inline.reflinkSearch = edit$1(inline.reflinkSearch, 'g').replace('reflink', inline.reflink).replace('nolink', inline.nolink).getRegex();
      /**
       * Normal Inline Grammar
       */

      inline.normal = merge$1({}, inline);
      /**
       * Pedantic Inline Grammar
       */

      inline.pedantic = merge$1({}, inline.normal, {
        strong: {
          start: /^__|\*\*/,
          middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
          endAst: /\*\*(?!\*)/g,
          endUnd: /__(?!_)/g
        },
        em: {
          start: /^_|\*/,
          middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
          endAst: /\*(?!\*)/g,
          endUnd: /_(?!_)/g
        },
        link: edit$1(/^!?\[(label)\]\((.*?)\)/).replace('label', inline._label).getRegex(),
        reflink: edit$1(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace('label', inline._label).getRegex()
      });
      /**
       * GFM Inline Grammar
       */

      inline.gfm = merge$1({}, inline.normal, {
        escape: edit$1(inline.escape).replace('])', '~|])').getRegex(),
        _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
        url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
        _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
        del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
        text: /^([`~]+|[^`~])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
      });
      inline.gfm.url = edit$1(inline.gfm.url, 'i').replace('email', inline.gfm._extended_email).getRegex();
      /**
       * GFM + Line Breaks Inline Grammar
       */

      inline.breaks = merge$1({}, inline.gfm, {
        br: edit$1(inline.br).replace('{2,}', '*').getRegex(),
        text: edit$1(inline.gfm.text).replace('\\b_', '\\b_| {2,}\\n').replace(/\{2,\}/g, '*').getRegex()
      });
      var rules = {
        block: block,
        inline: inline
      };

      var defaults$2 = defaults.defaults;
      var block$1 = rules.block,
          inline$1 = rules.inline;
      var repeatString$1 = helpers.repeatString;
      /**
       * smartypants text replacement
       */

      function smartypants(text) {
        return text // em-dashes
        .replace(/---/g, "\u2014") // en-dashes
        .replace(/--/g, "\u2013") // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018") // closing singles & apostrophes
        .replace(/'/g, "\u2019") // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C") // closing doubles
        .replace(/"/g, "\u201D") // ellipses
        .replace(/\.{3}/g, "\u2026");
      }
      /**
       * mangle email addresses
       */


      function mangle(text) {
        var out = '',
            i,
            ch;
        var l = text.length;

        for (i = 0; i < l; i++) {
          ch = text.charCodeAt(i);

          if (Math.random() > 0.5) {
            ch = 'x' + ch.toString(16);
          }

          out += '&#' + ch + ';';
        }

        return out;
      }
      /**
       * Block Lexer
       */


      var Lexer_1 = /*#__PURE__*/function () {
        function Lexer(options) {
          this.tokens = [];
          this.tokens.links = Object.create(null);
          this.options = options || defaults$2;
          this.options.tokenizer = this.options.tokenizer || new Tokenizer_1();
          this.tokenizer = this.options.tokenizer;
          this.tokenizer.options = this.options;
          var rules = {
            block: block$1.normal,
            inline: inline$1.normal
          };

          if (this.options.pedantic) {
            rules.block = block$1.pedantic;
            rules.inline = inline$1.pedantic;
          } else if (this.options.gfm) {
            rules.block = block$1.gfm;

            if (this.options.breaks) {
              rules.inline = inline$1.breaks;
            } else {
              rules.inline = inline$1.gfm;
            }
          }

          this.tokenizer.rules = rules;
        }
        /**
         * Expose Rules
         */


        /**
         * Static Lex Method
         */
        Lexer.lex = function lex(src, options) {
          var lexer = new Lexer(options);
          return lexer.lex(src);
        }
        /**
         * Static Lex Inline Method
         */
        ;

        Lexer.lexInline = function lexInline(src, options) {
          var lexer = new Lexer(options);
          return lexer.inlineTokens(src);
        }
        /**
         * Preprocessing
         */
        ;

        var _proto = Lexer.prototype;

        _proto.lex = function lex(src) {
          src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ');
          this.blockTokens(src, this.tokens, true);
          this.inline(this.tokens);
          return this.tokens;
        }
        /**
         * Lexing
         */
        ;

        _proto.blockTokens = function blockTokens(src, tokens, top) {
          if (tokens === void 0) {
            tokens = [];
          }

          if (top === void 0) {
            top = true;
          }

          src = src.replace(/^ +$/gm, '');
          var token, i, l, lastToken;

          while (src) {
            // newline
            if (token = this.tokenizer.space(src)) {
              src = src.substring(token.raw.length);

              if (token.type) {
                tokens.push(token);
              }

              continue;
            } // code


            if (token = this.tokenizer.code(src, tokens)) {
              src = src.substring(token.raw.length);

              if (token.type) {
                tokens.push(token);
              } else {
                lastToken = tokens[tokens.length - 1];
                lastToken.raw += '\n' + token.raw;
                lastToken.text += '\n' + token.text;
              }

              continue;
            } // fences


            if (token = this.tokenizer.fences(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // heading


            if (token = this.tokenizer.heading(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // table no leading pipe (gfm)


            if (token = this.tokenizer.nptable(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // hr


            if (token = this.tokenizer.hr(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // blockquote


            if (token = this.tokenizer.blockquote(src)) {
              src = src.substring(token.raw.length);
              token.tokens = this.blockTokens(token.text, [], top);
              tokens.push(token);
              continue;
            } // list


            if (token = this.tokenizer.list(src)) {
              src = src.substring(token.raw.length);
              l = token.items.length;

              for (i = 0; i < l; i++) {
                token.items[i].tokens = this.blockTokens(token.items[i].text, [], false);
              }

              tokens.push(token);
              continue;
            } // html


            if (token = this.tokenizer.html(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // def


            if (top && (token = this.tokenizer.def(src))) {
              src = src.substring(token.raw.length);

              if (!this.tokens.links[token.tag]) {
                this.tokens.links[token.tag] = {
                  href: token.href,
                  title: token.title
                };
              }

              continue;
            } // table (gfm)


            if (token = this.tokenizer.table(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // lheading


            if (token = this.tokenizer.lheading(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // top-level paragraph


            if (top && (token = this.tokenizer.paragraph(src))) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // text


            if (token = this.tokenizer.text(src, tokens)) {
              src = src.substring(token.raw.length);

              if (token.type) {
                tokens.push(token);
              } else {
                lastToken = tokens[tokens.length - 1];
                lastToken.raw += '\n' + token.raw;
                lastToken.text += '\n' + token.text;
              }

              continue;
            }

            if (src) {
              var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

              if (this.options.silent) {
                console.error(errMsg);
                break;
              } else {
                throw new Error(errMsg);
              }
            }
          }

          return tokens;
        };

        _proto.inline = function inline(tokens) {
          var i, j, k, l2, row, token;
          var l = tokens.length;

          for (i = 0; i < l; i++) {
            token = tokens[i];

            switch (token.type) {
              case 'paragraph':
              case 'text':
              case 'heading':
                {
                  token.tokens = [];
                  this.inlineTokens(token.text, token.tokens);
                  break;
                }

              case 'table':
                {
                  token.tokens = {
                    header: [],
                    cells: []
                  }; // header

                  l2 = token.header.length;

                  for (j = 0; j < l2; j++) {
                    token.tokens.header[j] = [];
                    this.inlineTokens(token.header[j], token.tokens.header[j]);
                  } // cells


                  l2 = token.cells.length;

                  for (j = 0; j < l2; j++) {
                    row = token.cells[j];
                    token.tokens.cells[j] = [];

                    for (k = 0; k < row.length; k++) {
                      token.tokens.cells[j][k] = [];
                      this.inlineTokens(row[k], token.tokens.cells[j][k]);
                    }
                  }

                  break;
                }

              case 'blockquote':
                {
                  this.inline(token.tokens);
                  break;
                }

              case 'list':
                {
                  l2 = token.items.length;

                  for (j = 0; j < l2; j++) {
                    this.inline(token.items[j].tokens);
                  }

                  break;
                }
            }
          }

          return tokens;
        }
        /**
         * Lexing/Compiling
         */
        ;

        _proto.inlineTokens = function inlineTokens(src, tokens, inLink, inRawBlock) {
          if (tokens === void 0) {
            tokens = [];
          }

          if (inLink === void 0) {
            inLink = false;
          }

          if (inRawBlock === void 0) {
            inRawBlock = false;
          }

          var token; // String with links masked to avoid interference with em and strong

          var maskedSrc = src;
          var match;
          var keepPrevChar, prevChar; // Mask out reflinks

          if (this.tokens.links) {
            var links = Object.keys(this.tokens.links);

            if (links.length > 0) {
              while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
                if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
                  maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString$1('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
                }
              }
            }
          } // Mask out other blocks


          while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
            maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString$1('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
          }

          while (src) {
            if (!keepPrevChar) {
              prevChar = '';
            }

            keepPrevChar = false; // escape

            if (token = this.tokenizer.escape(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // tag


            if (token = this.tokenizer.tag(src, inLink, inRawBlock)) {
              src = src.substring(token.raw.length);
              inLink = token.inLink;
              inRawBlock = token.inRawBlock;
              tokens.push(token);
              continue;
            } // link


            if (token = this.tokenizer.link(src)) {
              src = src.substring(token.raw.length);

              if (token.type === 'link') {
                token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
              }

              tokens.push(token);
              continue;
            } // reflink, nolink


            if (token = this.tokenizer.reflink(src, this.tokens.links)) {
              src = src.substring(token.raw.length);

              if (token.type === 'link') {
                token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
              }

              tokens.push(token);
              continue;
            } // strong


            if (token = this.tokenizer.strong(src, maskedSrc, prevChar)) {
              src = src.substring(token.raw.length);
              token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
              tokens.push(token);
              continue;
            } // em


            if (token = this.tokenizer.em(src, maskedSrc, prevChar)) {
              src = src.substring(token.raw.length);
              token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
              tokens.push(token);
              continue;
            } // code


            if (token = this.tokenizer.codespan(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // br


            if (token = this.tokenizer.br(src)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // del (gfm)


            if (token = this.tokenizer.del(src)) {
              src = src.substring(token.raw.length);
              token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
              tokens.push(token);
              continue;
            } // autolink


            if (token = this.tokenizer.autolink(src, mangle)) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // url (gfm)


            if (!inLink && (token = this.tokenizer.url(src, mangle))) {
              src = src.substring(token.raw.length);
              tokens.push(token);
              continue;
            } // text


            if (token = this.tokenizer.inlineText(src, inRawBlock, smartypants)) {
              src = src.substring(token.raw.length);
              prevChar = token.raw.slice(-1);
              keepPrevChar = true;
              tokens.push(token);
              continue;
            }

            if (src) {
              var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

              if (this.options.silent) {
                console.error(errMsg);
                break;
              } else {
                throw new Error(errMsg);
              }
            }
          }

          return tokens;
        };

        _createClass(Lexer, null, [{
          key: "rules",
          get: function get() {
            return {
              block: block$1,
              inline: inline$1
            };
          }
        }]);

        return Lexer;
      }();

      var defaults$3 = defaults.defaults;
      var cleanUrl$1 = helpers.cleanUrl,
          escape$1 = helpers.escape;
      /**
       * Renderer
       */

      var Renderer_1 = /*#__PURE__*/function () {
        function Renderer(options) {
          this.options = options || defaults$3;
        }

        var _proto = Renderer.prototype;

        _proto.code = function code(_code, infostring, escaped) {
          var lang = (infostring || '').match(/\S*/)[0];

          if (this.options.highlight) {
            var out = this.options.highlight(_code, lang);

            if (out != null && out !== _code) {
              escaped = true;
              _code = out;
            }
          }

          if (!lang) {
            return '<pre><code>' + (escaped ? _code : escape$1(_code, true)) + '</code></pre>\n';
          }

          return '<pre><code class="' + this.options.langPrefix + escape$1(lang, true) + '">' + (escaped ? _code : escape$1(_code, true)) + '</code></pre>\n';
        };

        _proto.blockquote = function blockquote(quote) {
          return '<blockquote>\n' + quote + '</blockquote>\n';
        };

        _proto.html = function html(_html) {
          return _html;
        };

        _proto.heading = function heading(text, level, raw, slugger) {
          if (this.options.headerIds) {
            return '<h' + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text + '</h' + level + '>\n';
          } // ignore IDs


          return '<h' + level + '>' + text + '</h' + level + '>\n';
        };

        _proto.hr = function hr() {
          return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
        };

        _proto.list = function list(body, ordered, start) {
          var type = ordered ? 'ol' : 'ul',
              startatt = ordered && start !== 1 ? ' start="' + start + '"' : '';
          return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
        };

        _proto.listitem = function listitem(text) {
          return '<li>' + text + '</li>\n';
        };

        _proto.checkbox = function checkbox(checked) {
          return '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"' + (this.options.xhtml ? ' /' : '') + '> ';
        };

        _proto.paragraph = function paragraph(text) {
          return '<p>' + text + '</p>\n';
        };

        _proto.table = function table(header, body) {
          if (body) body = '<tbody>' + body + '</tbody>';
          return '<table>\n' + '<thead>\n' + header + '</thead>\n' + body + '</table>\n';
        };

        _proto.tablerow = function tablerow(content) {
          return '<tr>\n' + content + '</tr>\n';
        };

        _proto.tablecell = function tablecell(content, flags) {
          var type = flags.header ? 'th' : 'td';
          var tag = flags.align ? '<' + type + ' align="' + flags.align + '">' : '<' + type + '>';
          return tag + content + '</' + type + '>\n';
        } // span level renderer
        ;

        _proto.strong = function strong(text) {
          return '<strong>' + text + '</strong>';
        };

        _proto.em = function em(text) {
          return '<em>' + text + '</em>';
        };

        _proto.codespan = function codespan(text) {
          return '<code>' + text + '</code>';
        };

        _proto.br = function br() {
          return this.options.xhtml ? '<br/>' : '<br>';
        };

        _proto.del = function del(text) {
          return '<del>' + text + '</del>';
        };

        _proto.link = function link(href, title, text) {
          href = cleanUrl$1(this.options.sanitize, this.options.baseUrl, href);

          if (href === null) {
            return text;
          }

          var out = '<a href="' + escape$1(href) + '"';

          if (title) {
            out += ' title="' + title + '"';
          }

          out += '>' + text + '</a>';
          return out;
        };

        _proto.image = function image(href, title, text) {
          href = cleanUrl$1(this.options.sanitize, this.options.baseUrl, href);

          if (href === null) {
            return text;
          }

          var out = '<img src="' + href + '" alt="' + text + '"';

          if (title) {
            out += ' title="' + title + '"';
          }

          out += this.options.xhtml ? '/>' : '>';
          return out;
        };

        _proto.text = function text(_text) {
          return _text;
        };

        return Renderer;
      }();

      /**
       * TextRenderer
       * returns only the textual part of the token
       */
      var TextRenderer_1 = /*#__PURE__*/function () {
        function TextRenderer() {}

        var _proto = TextRenderer.prototype;

        // no need for block level renderers
        _proto.strong = function strong(text) {
          return text;
        };

        _proto.em = function em(text) {
          return text;
        };

        _proto.codespan = function codespan(text) {
          return text;
        };

        _proto.del = function del(text) {
          return text;
        };

        _proto.html = function html(text) {
          return text;
        };

        _proto.text = function text(_text) {
          return _text;
        };

        _proto.link = function link(href, title, text) {
          return '' + text;
        };

        _proto.image = function image(href, title, text) {
          return '' + text;
        };

        _proto.br = function br() {
          return '';
        };

        return TextRenderer;
      }();

      /**
       * Slugger generates header id
       */
      var Slugger_1 = /*#__PURE__*/function () {
        function Slugger() {
          this.seen = {};
        }

        var _proto = Slugger.prototype;

        _proto.serialize = function serialize(value) {
          return value.toLowerCase().trim() // remove html tags
          .replace(/<[!\/a-z].*?>/ig, '') // remove unwanted chars
          .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '').replace(/\s/g, '-');
        }
        /**
         * Finds the next safe (unique) slug to use
         */
        ;

        _proto.getNextSafeSlug = function getNextSafeSlug(originalSlug, isDryRun) {
          var slug = originalSlug;
          var occurenceAccumulator = 0;

          if (this.seen.hasOwnProperty(slug)) {
            occurenceAccumulator = this.seen[originalSlug];

            do {
              occurenceAccumulator++;
              slug = originalSlug + '-' + occurenceAccumulator;
            } while (this.seen.hasOwnProperty(slug));
          }

          if (!isDryRun) {
            this.seen[originalSlug] = occurenceAccumulator;
            this.seen[slug] = 0;
          }

          return slug;
        }
        /**
         * Convert string to unique id
         * @param {object} options
         * @param {boolean} options.dryrun Generates the next unique slug without updating the internal accumulator.
         */
        ;

        _proto.slug = function slug(value, options) {
          if (options === void 0) {
            options = {};
          }

          var slug = this.serialize(value);
          return this.getNextSafeSlug(slug, options.dryrun);
        };

        return Slugger;
      }();

      var defaults$4 = defaults.defaults;
      var unescape$1 = helpers.unescape;
      /**
       * Parsing & Compiling
       */

      var Parser_1 = /*#__PURE__*/function () {
        function Parser(options) {
          this.options = options || defaults$4;
          this.options.renderer = this.options.renderer || new Renderer_1();
          this.renderer = this.options.renderer;
          this.renderer.options = this.options;
          this.textRenderer = new TextRenderer_1();
          this.slugger = new Slugger_1();
        }
        /**
         * Static Parse Method
         */


        Parser.parse = function parse(tokens, options) {
          var parser = new Parser(options);
          return parser.parse(tokens);
        }
        /**
         * Static Parse Inline Method
         */
        ;

        Parser.parseInline = function parseInline(tokens, options) {
          var parser = new Parser(options);
          return parser.parseInline(tokens);
        }
        /**
         * Parse Loop
         */
        ;

        var _proto = Parser.prototype;

        _proto.parse = function parse(tokens, top) {
          if (top === void 0) {
            top = true;
          }

          var out = '',
              i,
              j,
              k,
              l2,
              l3,
              row,
              cell,
              header,
              body,
              token,
              ordered,
              start,
              loose,
              itemBody,
              item,
              checked,
              task,
              checkbox;
          var l = tokens.length;

          for (i = 0; i < l; i++) {
            token = tokens[i];

            switch (token.type) {
              case 'space':
                {
                  continue;
                }

              case 'hr':
                {
                  out += this.renderer.hr();
                  continue;
                }

              case 'heading':
                {
                  out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape$1(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
                  continue;
                }

              case 'code':
                {
                  out += this.renderer.code(token.text, token.lang, token.escaped);
                  continue;
                }

              case 'table':
                {
                  header = ''; // header

                  cell = '';
                  l2 = token.header.length;

                  for (j = 0; j < l2; j++) {
                    cell += this.renderer.tablecell(this.parseInline(token.tokens.header[j]), {
                      header: true,
                      align: token.align[j]
                    });
                  }

                  header += this.renderer.tablerow(cell);
                  body = '';
                  l2 = token.cells.length;

                  for (j = 0; j < l2; j++) {
                    row = token.tokens.cells[j];
                    cell = '';
                    l3 = row.length;

                    for (k = 0; k < l3; k++) {
                      cell += this.renderer.tablecell(this.parseInline(row[k]), {
                        header: false,
                        align: token.align[k]
                      });
                    }

                    body += this.renderer.tablerow(cell);
                  }

                  out += this.renderer.table(header, body);
                  continue;
                }

              case 'blockquote':
                {
                  body = this.parse(token.tokens);
                  out += this.renderer.blockquote(body);
                  continue;
                }

              case 'list':
                {
                  ordered = token.ordered;
                  start = token.start;
                  loose = token.loose;
                  l2 = token.items.length;
                  body = '';

                  for (j = 0; j < l2; j++) {
                    item = token.items[j];
                    checked = item.checked;
                    task = item.task;
                    itemBody = '';

                    if (item.task) {
                      checkbox = this.renderer.checkbox(checked);

                      if (loose) {
                        if (item.tokens.length > 0 && item.tokens[0].type === 'text') {
                          item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;

                          if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                            item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                          }
                        } else {
                          item.tokens.unshift({
                            type: 'text',
                            text: checkbox
                          });
                        }
                      } else {
                        itemBody += checkbox;
                      }
                    }

                    itemBody += this.parse(item.tokens, loose);
                    body += this.renderer.listitem(itemBody, task, checked);
                  }

                  out += this.renderer.list(body, ordered, start);
                  continue;
                }

              case 'html':
                {
                  // TODO parse inline content if parameter markdown=1
                  out += this.renderer.html(token.text);
                  continue;
                }

              case 'paragraph':
                {
                  out += this.renderer.paragraph(this.parseInline(token.tokens));
                  continue;
                }

              case 'text':
                {
                  body = token.tokens ? this.parseInline(token.tokens) : token.text;

                  while (i + 1 < l && tokens[i + 1].type === 'text') {
                    token = tokens[++i];
                    body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
                  }

                  out += top ? this.renderer.paragraph(body) : body;
                  continue;
                }

              default:
                {
                  var errMsg = 'Token with "' + token.type + '" type was not found.';

                  if (this.options.silent) {
                    console.error(errMsg);
                    return;
                  } else {
                    throw new Error(errMsg);
                  }
                }
            }
          }

          return out;
        }
        /**
         * Parse Inline Tokens
         */
        ;

        _proto.parseInline = function parseInline(tokens, renderer) {
          renderer = renderer || this.renderer;
          var out = '',
              i,
              token;
          var l = tokens.length;

          for (i = 0; i < l; i++) {
            token = tokens[i];

            switch (token.type) {
              case 'escape':
                {
                  out += renderer.text(token.text);
                  break;
                }

              case 'html':
                {
                  out += renderer.html(token.text);
                  break;
                }

              case 'link':
                {
                  out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'image':
                {
                  out += renderer.image(token.href, token.title, token.text);
                  break;
                }

              case 'strong':
                {
                  out += renderer.strong(this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'em':
                {
                  out += renderer.em(this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'codespan':
                {
                  out += renderer.codespan(token.text);
                  break;
                }

              case 'br':
                {
                  out += renderer.br();
                  break;
                }

              case 'del':
                {
                  out += renderer.del(this.parseInline(token.tokens, renderer));
                  break;
                }

              case 'text':
                {
                  out += renderer.text(token.text);
                  break;
                }

              default:
                {
                  var errMsg = 'Token with "' + token.type + '" type was not found.';

                  if (this.options.silent) {
                    console.error(errMsg);
                    return;
                  } else {
                    throw new Error(errMsg);
                  }
                }
            }
          }

          return out;
        };

        return Parser;
      }();

      var merge$2 = helpers.merge,
          checkSanitizeDeprecation$1 = helpers.checkSanitizeDeprecation,
          escape$2 = helpers.escape;
      var getDefaults = defaults.getDefaults,
          changeDefaults = defaults.changeDefaults,
          defaults$5 = defaults.defaults;
      /**
       * Marked
       */

      function marked(src, opt, callback) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
          throw new Error('marked(): input parameter is undefined or null');
        }

        if (typeof src !== 'string') {
          throw new Error('marked(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
        }

        if (typeof opt === 'function') {
          callback = opt;
          opt = null;
        }

        opt = merge$2({}, marked.defaults, opt || {});
        checkSanitizeDeprecation$1(opt);

        if (callback) {
          var highlight = opt.highlight;
          var tokens;

          try {
            tokens = Lexer_1.lex(src, opt);
          } catch (e) {
            return callback(e);
          }

          var done = function done(err) {
            var out;

            if (!err) {
              try {
                out = Parser_1.parse(tokens, opt);
              } catch (e) {
                err = e;
              }
            }

            opt.highlight = highlight;
            return err ? callback(err) : callback(null, out);
          };

          if (!highlight || highlight.length < 3) {
            return done();
          }

          delete opt.highlight;
          if (!tokens.length) return done();
          var pending = 0;
          marked.walkTokens(tokens, function (token) {
            if (token.type === 'code') {
              pending++;
              setTimeout(function () {
                highlight(token.text, token.lang, function (err, code) {
                  if (err) {
                    return done(err);
                  }

                  if (code != null && code !== token.text) {
                    token.text = code;
                    token.escaped = true;
                  }

                  pending--;

                  if (pending === 0) {
                    done();
                  }
                });
              }, 0);
            }
          });

          if (pending === 0) {
            done();
          }

          return;
        }

        try {
          var _tokens = Lexer_1.lex(src, opt);

          if (opt.walkTokens) {
            marked.walkTokens(_tokens, opt.walkTokens);
          }

          return Parser_1.parse(_tokens, opt);
        } catch (e) {
          e.message += '\nPlease report this to https://github.com/markedjs/marked.';

          if (opt.silent) {
            return '<p>An error occurred:</p><pre>' + escape$2(e.message + '', true) + '</pre>';
          }

          throw e;
        }
      }
      /**
       * Options
       */


      marked.options = marked.setOptions = function (opt) {
        merge$2(marked.defaults, opt);
        changeDefaults(marked.defaults);
        return marked;
      };

      marked.getDefaults = getDefaults;
      marked.defaults = defaults$5;
      /**
       * Use Extension
       */

      marked.use = function (extension) {
        var opts = merge$2({}, extension);

        if (extension.renderer) {
          (function () {
            var renderer = marked.defaults.renderer || new Renderer_1();

            var _loop = function _loop(prop) {
              var prevRenderer = renderer[prop];

              renderer[prop] = function () {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }

                var ret = extension.renderer[prop].apply(renderer, args);

                if (ret === false) {
                  ret = prevRenderer.apply(renderer, args);
                }

                return ret;
              };
            };

            for (var prop in extension.renderer) {
              _loop(prop);
            }

            opts.renderer = renderer;
          })();
        }

        if (extension.tokenizer) {
          (function () {
            var tokenizer = marked.defaults.tokenizer || new Tokenizer_1();

            var _loop2 = function _loop2(prop) {
              var prevTokenizer = tokenizer[prop];

              tokenizer[prop] = function () {
                for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }

                var ret = extension.tokenizer[prop].apply(tokenizer, args);

                if (ret === false) {
                  ret = prevTokenizer.apply(tokenizer, args);
                }

                return ret;
              };
            };

            for (var prop in extension.tokenizer) {
              _loop2(prop);
            }

            opts.tokenizer = tokenizer;
          })();
        }

        if (extension.walkTokens) {
          var walkTokens = marked.defaults.walkTokens;

          opts.walkTokens = function (token) {
            extension.walkTokens(token);

            if (walkTokens) {
              walkTokens(token);
            }
          };
        }

        marked.setOptions(opts);
      };
      /**
       * Run callback for every token
       */


      marked.walkTokens = function (tokens, callback) {
        for (var _iterator = _createForOfIteratorHelperLoose(tokens), _step; !(_step = _iterator()).done;) {
          var token = _step.value;
          callback(token);

          switch (token.type) {
            case 'table':
              {
                for (var _iterator2 = _createForOfIteratorHelperLoose(token.tokens.header), _step2; !(_step2 = _iterator2()).done;) {
                  var cell = _step2.value;
                  marked.walkTokens(cell, callback);
                }

                for (var _iterator3 = _createForOfIteratorHelperLoose(token.tokens.cells), _step3; !(_step3 = _iterator3()).done;) {
                  var row = _step3.value;

                  for (var _iterator4 = _createForOfIteratorHelperLoose(row), _step4; !(_step4 = _iterator4()).done;) {
                    var _cell = _step4.value;
                    marked.walkTokens(_cell, callback);
                  }
                }

                break;
              }

            case 'list':
              {
                marked.walkTokens(token.items, callback);
                break;
              }

            default:
              {
                if (token.tokens) {
                  marked.walkTokens(token.tokens, callback);
                }
              }
          }
        }
      };
      /**
       * Parse Inline
       */


      marked.parseInline = function (src, opt) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
          throw new Error('marked.parseInline(): input parameter is undefined or null');
        }

        if (typeof src !== 'string') {
          throw new Error('marked.parseInline(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
        }

        opt = merge$2({}, marked.defaults, opt || {});
        checkSanitizeDeprecation$1(opt);

        try {
          var tokens = Lexer_1.lexInline(src, opt);

          if (opt.walkTokens) {
            marked.walkTokens(tokens, opt.walkTokens);
          }

          return Parser_1.parseInline(tokens, opt);
        } catch (e) {
          e.message += '\nPlease report this to https://github.com/markedjs/marked.';

          if (opt.silent) {
            return '<p>An error occurred:</p><pre>' + escape$2(e.message + '', true) + '</pre>';
          }

          throw e;
        }
      };
      /**
       * Expose
       */


      marked.Parser = Parser_1;
      marked.parser = Parser_1.parse;
      marked.Renderer = Renderer_1;
      marked.TextRenderer = TextRenderer_1;
      marked.Lexer = Lexer_1;
      marked.lexer = Lexer_1.lex;
      marked.Tokenizer = Tokenizer_1;
      marked.Slugger = Slugger_1;
      marked.parse = marked;
      var marked_1 = marked;

      return marked_1;

    })));
    });

    /* src/components/PreviewCard.svelte generated by Svelte v3.31.0 */
    const file$9 = "src/components/PreviewCard.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (80:4) {#each meta.tags as tag}
    function create_each_block$2(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[4] + "";
    	let t;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);

    			attr_dev(span, "class", span_class_value = /*activeTags*/ ctx[2].includes(/*tag*/ ctx[4])
    			? "tag active"
    			: "tag");

    			add_location(span, file$9, 80, 1, 1492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					span,
    					"click",
    					function () {
    						if (is_function(/*dispatch*/ ctx[3]("tagclick", /*tag*/ ctx[4]))) /*dispatch*/ ctx[3]("tagclick", /*tag*/ ctx[4]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*meta*/ 1 && t_value !== (t_value = /*tag*/ ctx[4] + "")) set_data_dev(t, t_value);

    			if (dirty & /*activeTags, meta*/ 5 && span_class_value !== (span_class_value = /*activeTags*/ ctx[2].includes(/*tag*/ ctx[4])
    			? "tag active"
    			: "tag")) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(80:4) {#each meta.tags as tag}",
    		ctx
    	});

    	return block;
    }

    // (64:0) <Card>
    function create_default_slot$5(ctx) {
    	let t0_value = /*meta*/ ctx[0].frontmatter.published + "";
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let a;
    	let t3_value = /*meta*/ ctx[0].frontmatter.title + "";
    	let t3;
    	let t4;
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t5;
    	let div3;
    	let raw_value = marked(/*meta*/ ctx[0].frontmatter.summary) + "";
    	let t6;
    	let each_1_anchor;
    	let each_value = /*meta*/ ctx[0].tags;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			a = element("a");
    			t3 = text(t3_value);
    			t4 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t5 = space();
    			div3 = element("div");
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(br, file$9, 65, 4, 1090);
    			attr_dev(a, "class", "title svelte-121lrcv");
    			attr_dev(a, "href", /*path*/ ctx[1]);
    			add_location(a, file$9, 66, 4, 1099);
    			attr_dev(img, "class", "center-cropped svelte-121lrcv");
    			if (img.src !== (img_src_value = "/images/" + /*meta*/ ctx[0].frontmatter.thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "thumbnail");
    			add_location(img, file$9, 71, 5, 1250);
    			attr_dev(div0, "class", "svelte-121lrcv");
    			add_location(div0, file$9, 70, 5, 1239);
    			attr_dev(div1, "class", "square svelte-121lrcv");
    			add_location(div1, file$9, 69, 5, 1213);
    			attr_dev(div2, "class", "thumbnail svelte-121lrcv");
    			add_location(div2, file$9, 68, 1, 1184);
    			attr_dev(div3, "class", "summary svelte-121lrcv");
    			add_location(div3, file$9, 75, 1, 1375);
    			attr_dev(div4, "class", "content svelte-121lrcv");
    			add_location(div4, file$9, 67, 4, 1161);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			div3.innerHTML = raw_value;
    			insert_dev(target, t6, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*meta*/ 1 && t0_value !== (t0_value = /*meta*/ ctx[0].frontmatter.published + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*meta*/ 1 && t3_value !== (t3_value = /*meta*/ ctx[0].frontmatter.title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*path*/ 2) {
    				attr_dev(a, "href", /*path*/ ctx[1]);
    			}

    			if (dirty & /*meta*/ 1 && img.src !== (img_src_value = "/images/" + /*meta*/ ctx[0].frontmatter.thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*meta*/ 1 && raw_value !== (raw_value = marked(/*meta*/ ctx[0].frontmatter.summary) + "")) div3.innerHTML = raw_value;
    			if (dirty & /*activeTags, meta, dispatch*/ 13) {
    				each_value = /*meta*/ ctx[0].tags;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t6);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(64:0) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, meta, activeTags, path*/ 135) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PreviewCard", slots, []);
    	const dispatch = createEventDispatcher();
    	let { meta } = $$props;
    	let { path } = $$props;
    	let { activeTags } = $$props;
    	const writable_props = ["meta", "path", "activeTags"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PreviewCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("meta" in $$props) $$invalidate(0, meta = $$props.meta);
    		if ("path" in $$props) $$invalidate(1, path = $$props.path);
    		if ("activeTags" in $$props) $$invalidate(2, activeTags = $$props.activeTags);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Card,
    		dispatch,
    		marked,
    		meta,
    		path,
    		activeTags
    	});

    	$$self.$inject_state = $$props => {
    		if ("meta" in $$props) $$invalidate(0, meta = $$props.meta);
    		if ("path" in $$props) $$invalidate(1, path = $$props.path);
    		if ("activeTags" in $$props) $$invalidate(2, activeTags = $$props.activeTags);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [meta, path, activeTags, dispatch];
    }

    class PreviewCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { meta: 0, path: 1, activeTags: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PreviewCard",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*meta*/ ctx[0] === undefined && !("meta" in props)) {
    			console.warn("<PreviewCard> was created without expected prop 'meta'");
    		}

    		if (/*path*/ ctx[1] === undefined && !("path" in props)) {
    			console.warn("<PreviewCard> was created without expected prop 'path'");
    		}

    		if (/*activeTags*/ ctx[2] === undefined && !("activeTags" in props)) {
    			console.warn("<PreviewCard> was created without expected prop 'activeTags'");
    		}
    	}

    	get meta() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set meta(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTags() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTags(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    PreviewCard.$compile = {"vars":[{"name":"createEventDispatcher","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"Card","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"dispatch","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"marked","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"meta","export_name":"meta","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"path","export_name":"path","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"activeTags","export_name":"activeTags","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    /* src/pages/projects/index.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$a = "src/pages/projects/index.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i].meta;
    	child_ctx[9] = list[i].path;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (48:0) <Card>
    function create_default_slot_1(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let div;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Projects";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Here are some of the projects that I've done.";
    			t3 = space();
    			div = element("div");
    			div.textContent = "A github calendar should be loading..";
    			add_location(h1, file$a, 48, 4, 1482);
    			add_location(p, file$a, 49, 4, 1504);
    			add_location(div, file$a, 52, 4, 1575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[4](div);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(48:0) <Card>",
    		ctx
    	});

    	return block;
    }

    // (57:4) {#each activeTags as tag}
    function create_each_block_1$1(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[12] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "active tag");
    			add_location(span, file$a, 57, 8, 1715);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activeTags*/ 1 && t_value !== (t_value = /*tag*/ ctx[12] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(57:4) {#each activeTags as tag}",
    		ctx
    	});

    	return block;
    }

    // (55:0) <Card>
    function create_default_slot$6(ctx) {
    	let t;
    	let each_1_anchor;
    	let each_value_1 = /*activeTags*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			t = text("Active tags:\n    ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*console, activeTags, filterPosts*/ 9) {
    				each_value_1 = /*activeTags*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(55:0) <Card>",
    		ctx
    	});

    	return block;
    }

    // (65:0) {#each posts as {meta, path}}
    function create_each_block$3(ctx) {
    	let previewcard;
    	let current;

    	previewcard = new PreviewCard({
    			props: {
    				meta: /*meta*/ ctx[8],
    				path: /*path*/ ctx[9],
    				activeTags: /*activeTags*/ ctx[0]
    			},
    			$$inline: true
    		});

    	previewcard.$on("tagclick", /*tagclick_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(previewcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(previewcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const previewcard_changes = {};
    			if (dirty & /*posts*/ 2) previewcard_changes.meta = /*meta*/ ctx[8];
    			if (dirty & /*posts*/ 2) previewcard_changes.path = /*path*/ ctx[9];
    			if (dirty & /*activeTags*/ 1) previewcard_changes.activeTags = /*activeTags*/ ctx[0];
    			previewcard.$set(previewcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(previewcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(previewcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(previewcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(65:0) {#each posts as {meta, path}}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let link;
    	let t0;
    	let card0;
    	let t1;
    	let card1;
    	let t2;
    	let each_1_anchor;
    	let current;

    	card0 = new Card({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card1 = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*posts*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			create_component(card0.$$.fragment);
    			t1 = space();
    			create_component(card1.$$.fragment);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://unpkg.com/github-calendar@latest/dist/github-calendar-responsive.css");
    			add_location(link, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(card0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(card1, target, anchor);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card0_changes = {};

    			if (dirty & /*$$scope, calendar*/ 32772) {
    				card0_changes.$$scope = { dirty, ctx };
    			}

    			card0.$set(card0_changes);
    			const card1_changes = {};

    			if (dirty & /*$$scope, activeTags*/ 32769) {
    				card1_changes.$$scope = { dirty, ctx };
    			}

    			card1.$set(card1_changes);

    			if (dirty & /*posts, activeTags, filterPosts*/ 11) {
    				each_value = /*posts*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			destroy_component(card0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(card1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $layout;
    	validate_store(layout, "layout");
    	component_subscribe($$self, layout, $$value => $$invalidate(7, $layout = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	let activeTags = [];
    	let posts;

    	function filterPosts(tags) {
    		$$invalidate(1, posts = $layout.children.filter(c => c.meta["frontmatter"]).map(c => {
    			let tags = [];

    			if (c.meta["frontmatter"]["tags"]) {
    				tags = c.meta["frontmatter"]["tags"].split(",").map(str => str.trim());
    			}

    			tags = tags.sort();
    			c.meta["tags"] = tags;
    			return c;
    		}).filter(c => {
    			let intersection = c.meta["tags"].filter(v => tags.includes(v));
    			return tags.length === 0 || intersection.length === tags.length;
    		}).sort((a, b) => b.meta["frontmatter"].published.localeCompare(a.meta["frontmatter"].published)));
    	}

    	filterPosts(activeTags);
    	let calendar;

    	onMount(async () => {
    		lib$9(calendar, "raytran", { responsive: true, tooltips: true });
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			calendar = $$value;
    			$$invalidate(2, calendar);
    		});
    	}

    	const click_handler = e => {
    		console.log(e);
    		$$invalidate(0, activeTags = activeTags.filter(x => x !== e.target.textContent).sort());
    		filterPosts(activeTags);
    	};

    	const tagclick_handler = e => {
    		if (!activeTags.includes(e.detail)) $$invalidate(0, activeTags = [...activeTags, e.detail].sort()); else $$invalidate(0, activeTags = activeTags.filter(x => x !== e.detail).sort());
    		filterPosts(activeTags);
    	};

    	$$self.$capture_state = () => ({
    		url,
    		layout,
    		onMount,
    		GithubCalendar: lib$9,
    		PreviewCard,
    		Card,
    		activeTags,
    		posts,
    		filterPosts,
    		calendar,
    		$layout
    	});

    	$$self.$inject_state = $$props => {
    		if ("activeTags" in $$props) $$invalidate(0, activeTags = $$props.activeTags);
    		if ("posts" in $$props) $$invalidate(1, posts = $$props.posts);
    		if ("calendar" in $$props) $$invalidate(2, calendar = $$props.calendar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		activeTags,
    		posts,
    		calendar,
    		filterPosts,
    		div_binding,
    		click_handler,
    		tagclick_handler
    	];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }
    Projects.$compile = {"vars":[{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"onMount","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"GithubCalendar","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"PreviewCard","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"Card","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"activeTags","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"posts","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"filterPosts","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"calendar","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"$layout","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false}]};

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Projects
    });

    /* src/pages/projects/nerf-turret.md generated by Svelte v3.31.0 */
    const file$b = "src/pages/projects/nerf-turret.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$7(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Nerf gun beep boop";
    			add_location(p, file$b, 10, 0, 462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$2];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$7] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new ProjectPage({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$2)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$2 = {
    	"title": "Nerf Turret",
    	"published": "2021-01-1",
    	"author": "raytran",
    	"thumbnail": "turret.jpg",
    	"summary": "A robot turret",
    	"layout": "blog",
    	"tags": "personal, physical-object"
    };

    const { title: title$2, published: published$2, author: author$2, thumbnail: thumbnail$2, summary: summary$2, layout: layout$3, tags: tags$2 } = metadata$2;

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nerf_turret", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nerf_turret> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$2,
    		title: title$2,
    		published: published$2,
    		author: author$2,
    		thumbnail: thumbnail$2,
    		summary: summary$2,
    		layout: layout$3,
    		tags: tags$2,
    		Layout_MDSVEX_DEFAULT: ProjectPage
    	});

    	return [];
    }

    class Nerf_turret extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nerf_turret",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }
    Nerf_turret.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"published","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"author","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"thumbnail","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"tags","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var nerfTurret = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Nerf_turret,
        metadata: metadata$2
    });

    /* src/pages/projects/protochess.md generated by Svelte v3.31.0 */
    const file$c = "src/pages/projects/protochess.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$8(ctx) {
    	let p0;
    	let t0;
    	let a0;
    	let t2;
    	let t3;
    	let h1;
    	let t5;
    	let h20;
    	let t7;
    	let p1;
    	let t8;
    	let a1;
    	let t10;
    	let t11;
    	let div;
    	let iframe;
    	let iframe_src_value;
    	let t12;
    	let h21;
    	let t14;
    	let p2;
    	let t15;
    	let a2;
    	let t17;
    	let t18;
    	let p3;
    	let t20;
    	let p4;
    	let t22;
    	let p5;
    	let t24;
    	let p6;
    	let t26;
    	let p7;
    	let t27;
    	let a3;
    	let t29;
    	let t30;
    	let h22;
    	let t32;
    	let p8;
    	let t34;
    	let p9;
    	let t35;
    	let a4;
    	let t37;
    	let t38;
    	let p10;
    	let t40;
    	let p11;
    	let t42;
    	let ul0;
    	let li0;
    	let a5;
    	let t44;
    	let li1;
    	let a6;
    	let t46;
    	let li2;
    	let a7;
    	let t48;
    	let li3;
    	let a8;
    	let t50;
    	let h23;
    	let t52;
    	let p12;
    	let t54;
    	let p13;
    	let t56;
    	let pre0;

    	let raw0_value = `<code class="language-rust"><span class="token keyword">let</span> board <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token char string">'r'</span><span class="token punctuation">,</span> <span class="token char string">'n'</span><span class="token punctuation">,</span> <span class="token char string">'b'</span><span class="token punctuation">,</span> <span class="token char string">'q'</span><span class="token punctuation">,</span> <span class="token char string">'k'</span><span class="token punctuation">,</span> <span class="token char string">'b'</span><span class="token punctuation">,</span> <span class="token char string">'n'</span><span class="token punctuation">,</span> <span class="token char string">'r'</span><span class="token punctuation">,</span>
  <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span>
  <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
  <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
  <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
  <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
  <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span>
  <span class="token char string">'R'</span><span class="token punctuation">,</span> <span class="token char string">'N'</span><span class="token punctuation">,</span> <span class="token char string">'B'</span><span class="token punctuation">,</span> <span class="token char string">'Q'</span><span class="token punctuation">,</span> <span class="token char string">'K'</span><span class="token punctuation">,</span> <span class="token char string">'B'</span><span class="token punctuation">,</span> <span class="token char string">'N'</span><span class="token punctuation">,</span> <span class="token char string">'R'</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></code>` + "";

    	let t57;
    	let p14;
    	let t59;
    	let p15;
    	let t61;
    	let p16;
    	let t63;
    	let p17;
    	let t65;
    	let img0;
    	let img0_src_value;
    	let t66;
    	let p18;
    	let a9;
    	let t68;
    	let p19;
    	let t70;
    	let p20;
    	let t72;
    	let p21;
    	let t74;
    	let p22;
    	let t76;
    	let pre1;

    	let raw1_value = `<code class="language-rust"><span class="token char string">'r'</span><span class="token punctuation">,</span> <span class="token char string">'n'</span><span class="token punctuation">,</span> <span class="token char string">'b'</span><span class="token punctuation">,</span> <span class="token char string">'q'</span><span class="token punctuation">,</span> <span class="token char string">'k'</span><span class="token punctuation">,</span> <span class="token char string">'b'</span><span class="token punctuation">,</span> <span class="token char string">'n'</span><span class="token punctuation">,</span> <span class="token char string">'r'</span><span class="token punctuation">,</span>
<span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span> <span class="token char string">'p'</span><span class="token punctuation">,</span>
<span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
<span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
<span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
<span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span> <span class="token char string">' '</span><span class="token punctuation">,</span>
<span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span> <span class="token char string">'P'</span><span class="token punctuation">,</span>
<span class="token char string">'R'</span><span class="token punctuation">,</span> <span class="token char string">'N'</span><span class="token punctuation">,</span> <span class="token char string">'B'</span><span class="token punctuation">,</span> <span class="token char string">'Q'</span><span class="token punctuation">,</span> <span class="token char string">'K'</span><span class="token punctuation">,</span> <span class="token char string">'B'</span><span class="token punctuation">,</span> <span class="token char string">'N'</span><span class="token punctuation">,</span> <span class="token char string">'R'</span><span class="token punctuation">,</span></code>` + "";

    	let t77;
    	let p23;
    	let t79;
    	let pre2;

    	let raw2_value = `<code class="language-rust"><span class="token number">00000000</span>
<span class="token number">00000000</span>
<span class="token number">00000000</span>
<span class="token number">00000000</span>
<span class="token number">00000000</span>
<span class="token number">00000000</span>
<span class="token number">11111111</span>
<span class="token number">00000000</span></code>` + "";

    	let t80;
    	let p24;
    	let t82;
    	let p25;
    	let t84;
    	let p26;
    	let t85;
    	let code0;
    	let t87;
    	let code1;
    	let t89;
    	let t90;
    	let h24;
    	let t92;
    	let p27;
    	let t94;
    	let p28;
    	let t96;
    	let h30;
    	let t98;
    	let p29;
    	let t100;
    	let p30;
    	let t102;
    	let p31;
    	let t104;
    	let pre3;

    	let raw3_value = `<code class="language-rust"><span class="token keyword">let</span> moves <span class="token operator">=</span> <span class="token constant">KNIGHT_TABLE</span><span class="token punctuation">[</span><span class="token constant">C3</span><span class="token punctuation">]</span>
<span class="token comment">// which gives you:</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> x <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span></code>` + "";

    	let t105;
    	let p32;
    	let t107;
    	let p33;
    	let t109;
    	let pre4;

    	let raw4_value = `<code class="language-rust"><span class="token comment">//All moves, including attacking our own pieces</span>
<span class="token keyword">let</span> moves <span class="token operator">=</span> <span class="token constant">KNIGHT_TABLE</span><span class="token punctuation">[</span><span class="token constant">C3</span><span class="token punctuation">]</span>
<span class="token comment">//Moves, but only the ones that don't attack our own team</span>
moves <span class="token operator">&amp;=</span> <span class="token operator">!</span><span class="token constant">MY_PIECES</span> <span class="token comment">//Notice the use of the AND and NOT operators</span></code>` + "";

    	let t110;
    	let p34;
    	let t112;
    	let h31;
    	let t114;
    	let p35;
    	let t115;
    	let a10;
    	let t117;
    	let t118;
    	let p36;
    	let t120;
    	let pre5;

    	let raw5_value = `<code class="language-null">The direction (north, west, east, south, etc)
The pieces in the way (we’ll call them blockers)</code>` + "";

    	let t121;
    	let p37;
    	let t123;
    	let pre6;
    	let raw6_value = `<code class="language-null">00000000, 00000001, 00000010, ..... 11111111</code>` + "";
    	let t124;
    	let p38;
    	let t126;
    	let pre7;

    	let raw7_value = `<code class="language-rust"><span class="token keyword">for</span> i <span class="token keyword">in</span> <span class="token number">0</span><span class="token punctuation">..</span><span class="token number">256</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">let</span> state <span class="token operator">=</span> i<span class="token punctuation">;</span>
    <span class="token punctuation">...</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t127;
    	let p39;
    	let t129;
    	let pre8;
    	let raw8_value = `<code class="language-rust"><span class="token constant">SLIDING_MOVES</span><span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">[</span>occupancy<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token number">00111100</span></code>` + "";
    	let t130;
    	let p40;
    	let t132;
    	let p41;
    	let t134;
    	let pre9;

    	let raw9_value = `<code class="language-rust"><span class="token keyword">let</span> bitboard <span class="token operator">=</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token number">1</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span>
<span class="token number">1</span> <span class="token punctuation">.</span> x <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span></code>` + "";

    	let t135;
    	let pre10;

    	let raw10_value = `<code class="language-rust"><span class="token comment">//Shift the bitboard down to the first rank (8 bits per rank)</span>
bitboard <span class="token operator">=</span> bitboard <span class="token operator">>></span> <span class="token number">2</span> <span class="token operator">*</span> <span class="token number">8</span> 
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token number">1</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token punctuation">.</span>
<span class="token number">1</span> <span class="token punctuation">.</span> x <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span></code>` + "";

    	let t136;
    	let pre11;

    	let raw11_value = `<code class="language-rust"><span class="token comment">// Remove everything that is not on the first rank</span>
bitboard <span class="token operator">=</span> bitboard <span class="token operator">&amp;</span> <span class="token constant">FIRST_RANK</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span>
<span class="token number">1</span> <span class="token punctuation">.</span> x <span class="token punctuation">.</span> <span class="token number">1</span> <span class="token number">1</span> <span class="token punctuation">.</span> <span class="token punctuation">.</span></code>` + "";

    	let t137;
    	let p42;
    	let t139;
    	let pre12;

    	let raw12_value = `<code class="language-rust"><span class="token constant">SLIDING_MOVES</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">[</span>10001100b<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token number">11011000</span>
<span class="token comment">//2 is the x index with our mapping</span>
<span class="token comment">//10001100b represents the bits at the first rank</span>
<span class="token comment">//11011000 is the precalculated sliding moves</span></code>` + "";

    	let t140;
    	let p43;
    	let t142;
    	let pre13;

    	let raw13_value = `<code class="language-null">. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
1 1 x 1 1 . . .
. . . . . . . .
. . . . . . . .</code>` + "";

    	let t143;
    	let p44;
    	let t145;
    	let p45;
    	let t147;
    	let p46;
    	let t149;
    	let p47;
    	let t151;
    	let pre14;

    	let raw14_value = `<code class="language-rust"><span class="token keyword">let</span> movelist <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
<span class="token keyword">let</span> from_index <span class="token operator">=</span> <span class="token comment">/* some piece location */</span>
<span class="token keyword">let</span> moves_bitboard <span class="token operator">=</span> <span class="token constant">KNIGHT_TABLE</span><span class="token punctuation">[</span>from_index<span class="token punctuation">]</span>
<span class="token keyword">while</span> moves_bitboard <span class="token operator">!=</span> <span class="token number">0</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">let</span> to_index <span class="token operator">=</span> moves_bitboard<span class="token punctuation">.</span><span class="token function">lowest_one</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">//Compiled languages can do this very efficiently with intrinsics</span>
    movelist<span class="token punctuation">.</span><span class="token function">push</span><span class="token punctuation">(</span>new <span class="token class-name">Move</span><span class="token punctuation">(</span>from_index<span class="token punctuation">,</span> to_index<span class="token punctuation">)</span><span class="token punctuation">)</span>
    moves_bitboard<span class="token punctuation">.</span><span class="token function">set_bit</span><span class="token punctuation">(</span>from_index<span class="token punctuation">,</span> <span class="token boolean">false</span><span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t152;
    	let p48;
    	let t154;
    	let h32;
    	let t156;
    	let p49;
    	let em0;
    	let t158;
    	let t159;
    	let p50;
    	let em1;
    	let t161;
    	let t162;
    	let pre15;

    	let raw15_value = `<code class="language-rust"><span class="token keyword">fn</span> <span class="token function-definition function">perft</span><span class="token punctuation">(</span>int depth<span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
  <span class="token keyword">let</span> nodes <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
  <span class="token keyword">if</span> depth <span class="token operator">==</span> <span class="token number">0</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> <span class="token number">1</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  <span class="token keyword">for</span> <span class="token keyword">move</span> <span class="token keyword">in</span> <span class="token function">generate_moves</span><span class="token punctuation">(</span>board<span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    board<span class="token punctuation">.</span><span class="token function">makeMove</span><span class="token punctuation">(</span><span class="token keyword">move</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    nodes <span class="token operator">+=</span> <span class="token function">perft</span><span class="token punctuation">(</span>depth <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    board<span class="token punctuation">.</span><span class="token function">undoMove</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
  <span class="token keyword">return</span> nodes<span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t163;
    	let p51;
    	let t165;
    	let p52;
    	let t167;
    	let pre16;

    	let raw16_value = `<code class="language-null">depth nodes
0     1
1     20
2     400
3     8,902
4     197,281
5     4,865,609
6     119,060,324
7     3,195,901,860
8     84,998,978,956</code>` + "";

    	let t168;
    	let p53;
    	let a11;
    	let t170;
    	let p54;
    	let t171;
    	let code2;
    	let t173;
    	let code3;
    	let t175;
    	let t176;
    	let p55;
    	let t178;
    	let p56;
    	let t180;
    	let h25;
    	let t182;
    	let p57;
    	let t183;
    	let strong0;
    	let t185;
    	let strong1;
    	let t187;
    	let t188;
    	let p58;
    	let t189;
    	let strong2;
    	let t191;
    	let t192;
    	let pre17;

    	let raw17_value = `<code class="language-rust"><span class="token comment">// Scores are in centipawns</span>
<span class="token keyword">const</span> <span class="token constant">KING_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">9999</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">QUEEN_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">900</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">ROOK_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">500</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">BISHOP_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">350</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">KNIGHT_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">300</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">PAWN_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">100</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">CHECKMATED_SCORE</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">99999</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token constant">CASTLING_BONUS</span><span class="token punctuation">:</span><span class="token keyword">isize</span> <span class="token operator">=</span> <span class="token number">400</span><span class="token punctuation">;</span></code>` + "";

    	let t193;
    	let p59;
    	let t195;
    	let p60;
    	let t196;
    	let code4;
    	let t198;
    	let t199;
    	let p61;
    	let t200;
    	let strong3;
    	let t202;
    	let t203;
    	let p62;
    	let t205;
    	let pre18;

    	let raw18_value = `<code class="language-null">// pawn
0,  0,  0,  0,  0,  0,  0,  0,
50, 50, 50, 50, 50, 50, 50, 50,
10, 10, 20, 30, 30, 20, 10, 10,
5,  5,  10, 25, 25, 10,  5,  5,
0,  0,   0, 20, 20,  0,  0,  0,
5, -5, -10,  0,  0,-10, -5,  5,
5, 10,  10,-20,-20, 10, 10,  5,
0,  0,   0,  0,  0,  0,  0,  0</code>` + "";

    	let t206;
    	let p63;
    	let t208;
    	let p64;
    	let t210;
    	let p65;
    	let t212;
    	let h26;
    	let t214;
    	let p66;
    	let t216;
    	let p67;
    	let t218;
    	let p68;
    	let t220;
    	let p69;
    	let a12;
    	let t222;
    	let t223;
    	let img1;
    	let img1_src_value;
    	let t224;
    	let p70;
    	let t226;
    	let pre19;

    	let raw19_value = `<code class="language-rust">int <span class="token function">negaMax</span><span class="token punctuation">(</span> int depth <span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span> depth <span class="token operator">==</span> <span class="token number">0</span> <span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token function">evaluate</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    int max <span class="token operator">=</span> <span class="token operator">-</span>oo<span class="token punctuation">;</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span> all moves<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        score <span class="token operator">=</span> <span class="token operator">-</span><span class="token function">negaMax</span><span class="token punctuation">(</span> depth <span class="token operator">-</span> <span class="token number">1</span> <span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span> score <span class="token operator">></span> max <span class="token punctuation">)</span>
            max <span class="token operator">=</span> score<span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> max<span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t227;
    	let p71;
    	let t229;
    	let p72;
    	let t231;
    	let ul10;
    	let li7;
    	let t232;
    	let ul1;
    	let li4;
    	let t234;
    	let li5;
    	let t236;
    	let li6;
    	let t238;
    	let li9;
    	let t239;
    	let ul2;
    	let li8;
    	let t241;
    	let li11;
    	let t242;
    	let ul3;
    	let li10;
    	let t244;
    	let li13;
    	let t245;
    	let ul4;
    	let li12;
    	let t247;
    	let li15;
    	let t248;
    	let ul5;
    	let li14;
    	let t250;
    	let li17;
    	let t251;
    	let ul6;
    	let li16;
    	let t253;
    	let li19;
    	let t254;
    	let ul7;
    	let li18;
    	let t256;
    	let li21;
    	let t257;
    	let ul8;
    	let li20;
    	let t259;
    	let li23;
    	let t260;
    	let ul9;
    	let li22;
    	let t262;
    	let h27;
    	let t264;
    	let p73;
    	let t266;
    	let p74;
    	let t267;
    	let a13;
    	let t269;
    	let a14;
    	let t271;
    	let t272;
    	let p75;
    	let t274;
    	let p76;
    	let t275;
    	let a15;
    	let t277;
    	let t278;
    	let p77;
    	let t279;
    	let a16;
    	let t281;
    	let t282;
    	let p78;
    	let t284;
    	let h33;
    	let t286;
    	let p79;
    	let t288;
    	let p80;
    	let t290;
    	let img2;
    	let img2_src_value;
    	let t291;
    	let p81;
    	let t293;
    	let p82;
    	let t295;
    	let p83;
    	let t297;
    	let ul11;
    	let li24;
    	let t299;
    	let li25;
    	let t301;
    	let li26;
    	let t303;
    	let p84;
    	let t305;
    	let chambers;
    	let t306;
    	let p85;
    	let t308;
    	let p86;
    	let t310;
    	let p87;
    	let t311;
    	let em2;
    	let t313;
    	let t314;
    	let h28;
    	let t316;
    	let p88;
    	let t317;
    	let a17;
    	let t319;
    	let t320;
    	let p89;
    	let t322;
    	let p90;
    	let t323;
    	let a18;
    	let t325;
    	let a19;
    	let t327;
    	let p91;
    	let t329;
    	let p92;
    	let t330;
    	let a20;
    	let t332;
    	let t333;
    	let p93;
    	let t334;
    	let a21;
    	let t336;
    	let t337;
    	let p94;
    	let t339;
    	let p95;
    	let t340;
    	let a22;
    	let t342;
    	let t343;
    	let p96;
    	let t345;
    	let p97;
    	let a23;
    	let t347;
    	let t348;
    	let p98;
    	let t350;
    	let p99;
    	let t352;
    	let img3;
    	let img3_src_value;
    	let t353;
    	let img4;
    	let img4_src_value;
    	let t354;
    	let p100;
    	let a24;
    	let t356;
    	let p101;
    	let a25;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Note: this post was originally on the MIT Admissions website as a guest blogpost. If you want, you can read it on the MIT Admission site ");
    			a0 = element("a");
    			a0.textContent = "here";
    			t2 = text(".");
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = `${title$3}`;
    			t5 = space();
    			h20 = element("h2");
    			h20.textContent = `${subtitle}`;
    			t7 = space();
    			p1 = element("p");
    			t8 = text("TLDR: I made this chess website that lets you design custom pieces and boards. Play on it ");
    			a1 = element("a");
    			a1.textContent = "here";
    			t10 = text(". You can play against the chess engine I wrote as well.");
    			t11 = space();
    			div = element("div");
    			iframe = element("iframe");
    			t12 = space();
    			h21 = element("h2");
    			h21.textContent = "The Inspiration";
    			t14 = space();
    			p2 = element("p");
    			t15 = text("CPW. 2019. I was a but a lowly prefrosh making friends. I met Chambers. You might’ve heard of him. He’s that guy from the ");
    			a2 = element("a");
    			a2.textContent = "Duolingo thing";
    			t17 = text(".");
    			t18 = space();
    			p3 = element("p");
    			p3.textContent = "He challenged me to a game of chess. Aidan Chambers, the chess man. He was born from chess. Years of generational chess experience flows through his veins. Me? Raymond Tran? I haven’t played chess in years. Yet there I was, ready to challenge the one and only Aidan Chambers. Long story short he made some terrible mistake and I won.";
    			t20 = space();
    			p4 = element("p");
    			p4.textContent = "This didn’t phase me. But I know it hurt him. From this he would never recover. His chess confidence was destroyed. I broke him that day.";
    			t22 = space();
    			p5 = element("p");
    			p5.textContent = "Now he won’t stop talking about chess. Like a broken record. Since then, he’s been training his chess ability. Little does he know: so have I.";
    			t24 = space();
    			p6 = element("p");
    			p6.textContent = "For the past six months I have been secretly training in chess with hopes to beat Aidan Chambers yet again. During this time, I learned about the existence of chess variants: chess games with modified pieces and boards. I couldn’t find a website that let you build these yourself, so I did what any rational person would: devote the next six months of my life to writing a chess variant website.";
    			t26 = space();
    			p7 = element("p");
    			t27 = text("This blogpost is the story of how I wrote that website. Play on it ");
    			a3 = element("a");
    			a3.textContent = "here";
    			t29 = text(". The story of me vs Chambers in our ultimate chess battle? That story is to be continued….");
    			t30 = space();
    			h22 = element("h2");
    			h22.textContent = "Engine";
    			t32 = space();
    			p8 = element("p");
    			p8.textContent = "Behind every good chess website is a chess engine. This is the program that determines the rules behind chess and which moves are the best for any given board. Chess engines usually work by searching through all possible moves and picking the best one (the newer, machine-learning based chess engines are the exception). This sounds simple, and it is! Modern chess engines just use a lot of optimizations to be able to search deeper into the game tree.";
    			t34 = space();
    			p9 = element("p");
    			t35 = text("Sidenote: I think ");
    			a4 = element("a");
    			a4.textContent = "6.172";
    			t37 = text(" makes you write a chess engine for a chess variant called Leiserchess, but I haven’t taken that class yet so I could be wrong. I imagine a lot of the techniques I’m about to describe are also used in that class.");
    			t38 = space();
    			p10 = element("p");
    			p10.textContent = "Anyway:";
    			t40 = space();
    			p11 = element("p");
    			p11.textContent = "What goes into a (basic) chess engine?";
    			t42 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a5 = element("a");
    			a5.textContent = "Board Representation";
    			t44 = space();
    			li1 = element("li");
    			a6 = element("a");
    			a6.textContent = "Move Generation";
    			t46 = space();
    			li2 = element("li");
    			a7 = element("a");
    			a7.textContent = "Evaluation";
    			t48 = space();
    			li3 = element("li");
    			a8 = element("a");
    			a8.textContent = "Search";
    			t50 = space();
    			h23 = element("h2");
    			h23.textContent = "Board Representation";
    			t52 = space();
    			p12 = element("p");
    			p12.textContent = "Note: Protochess supports up to 16×16 sized boards and custom pieces that do crazy things, but for the purposes of this article I’ll be writing as if it were just a standard chess game. I will include a few sentences on where protochess differs in the approach, though.";
    			t54 = space();
    			p13 = element("p");
    			p13.textContent = "The first step to writing your own chess program is picking a way to represent your board. A natural approach would be something like this:";
    			t56 = space();
    			pre0 = element("pre");
    			t57 = space();
    			p14 = element("p");
    			p14.textContent = "A single array, with a character for each piece. Upper case for white, lowercase for black. This is called a square-centric approach, since we keep information based on the squares on the board.";
    			t59 = space();
    			p15 = element("p");
    			p15.textContent = "Cool, but a little too slow for our purposes. Remember: it’s essential that we do everything as fast as possible to have a good engine.";
    			t61 = space();
    			p16 = element("p");
    			p16.textContent = "We can use a trick! Computers are really good at doing math with 64 bit integers. 64 just happens to be the number of squares on a standard chess board! Funny coincidence. Knowing this, we can represent our pieces like this:";
    			t63 = space();
    			p17 = element("p");
    			p17.textContent = "Let’s call each 64 bit number a bitboard. A bitboard is just a mapping from bits in the number to places on the board. We can do this in a number of ways, but in protochess this is done using little-endian rank-file mapping. It looks like this:";
    			t65 = space();
    			img0 = element("img");
    			t66 = space();
    			p18 = element("p");
    			a9 = element("a");
    			a9.textContent = "image source";
    			t68 = space();
    			p19 = element("p");
    			p19.textContent = "Notice that the 0th bit is on the A1 square, and the 63rd bit is on the H8 square.";
    			t70 = space();
    			p20 = element("p");
    			p20.textContent = "We can represent the a board using one bitboard per piece type. We will have 12 in total (one for each piece type and color == 2x pawn, 2x knight, 2x king, 2x queen, 2x rook, 2x bishop)";
    			t72 = space();
    			p21 = element("p");
    			p21.textContent = "In each bitboard, set the bit to 1 if the piece is there, and 0 if the piece isn’t.";
    			t74 = space();
    			p22 = element("p");
    			p22.textContent = "For instance, if our board looks like this:";
    			t76 = space();
    			pre1 = element("pre");
    			t77 = space();
    			p23 = element("p");
    			p23.textContent = "The corresponding bitboard for the white pawns looks like this:";
    			t79 = space();
    			pre2 = element("pre");
    			t80 = space();
    			p24 = element("p");
    			p24.textContent = "Pretty simple huh? In contrast to the earlier array-based design, this is a piece-centric approach, since we focus on each piece type as a set of locations.";
    			t82 = space();
    			p25 = element("p");
    			p25.textContent = "We have a few advantages here, especially when you consider bitwise operations that computers can do.";
    			t84 = space();
    			p26 = element("p");
    			t85 = text("One of them is the AND (&): ");
    			code0 = element("code");
    			code0.textContent = "let c = (a & b)";
    			t87 = text(" takes two numbers a, b, and returns a new number c where each bit in c is true if the corresponding bits in a and b are true.\nUsing this representation, we can perform really powerful set-wise operations, such as asking “give me all the white pawns standing on the second rank.” In our array representation, we’d have to search through 8 indices, while now, we can write ");
    			code1 = element("code");
    			code1.textContent = "(WHITE_PAWNS & 2ND_RANK)";
    			t89 = text(".");
    			t90 = space();
    			h24 = element("h2");
    			h24.textContent = "Move Generation";
    			t92 = space();
    			p27 = element("p");
    			p27.textContent = "This is the game of chess itself, with all its moves and rules. While it’s simple in theory, it is actually the hardest part about writing an (efficient) chess engine.";
    			t94 = space();
    			p28 = element("p");
    			p28.textContent = "In chess, there are two types of pieces: jumping pieces and sliding pieces. Jumping pieces like the knight can “jump” over other pieces, while sliding pieces like the queen can have their movement blocked. Move generation for sliding and jumping pieces can be done very efficiently using bitboards.";
    			t96 = space();
    			h30 = element("h3");
    			h30.textContent = "Jumping pieces (knight, pawn, king)";
    			t98 = space();
    			p29 = element("p");
    			p29.textContent = "The fastest way to generate moves for any piece is to just look up the possible moves in a precomputed table. For jumping pieces, this is easy since we don’t have to consider any blockers in the way.";
    			t100 = space();
    			p30 = element("p");
    			p30.textContent = "At the start of our program, we initialize a huge table for jumping pieces (like the knight), mapping board locations (indices) to possible movements (as a Bitboard). We can use bit manipulation (bit shifts, masks) to set bits in the relevant locations for each jumping piece table.";
    			t102 = space();
    			p31 = element("p");
    			p31.textContent = "Then, during our program, we can access the movement by indexing the table. For instance, a knight sitting at C3 can be indexed like this:";
    			t104 = space();
    			pre3 = element("pre");
    			t105 = space();
    			p32 = element("p");
    			p32.textContent = "(For clarity, . is used instead of 0 and the C3 square is marked with an x instead of 0).";
    			t107 = space();
    			p33 = element("p");
    			p33.textContent = "It’s important to remember that these are just possible squares that we can move to. We don’t want to attack our own pieces, for instance.\nThis is where our choice of bitboards really shines. We can “block out” invalid moves like attacking your own pieces with simple bitwise operations, like so:";
    			t109 = space();
    			pre4 = element("pre");
    			t110 = space();
    			p34 = element("p");
    			p34.textContent = "With a few adjustments, it’s easy to see how the scheme above works for all jumping pieces (kings, pawns).";
    			t112 = space();
    			h31 = element("h3");
    			h31.textContent = "Sliding pieces";
    			t114 = space();
    			p35 = element("p");
    			t115 = text("Sliding pieces are a little more complicated. It is possible to use a similar approach as jumping pieces, but we would need a lot of memory and a few tricks (See: ");
    			a10 = element("a");
    			a10.textContent = "magic bitboards";
    			t117 = text(". Protochess, with it’s focus on having 16×16 sized customizable boards would need a LOT of memory.");
    			t118 = space();
    			p36 = element("p");
    			p36.textContent = "So instead, let’s think about what you really need to determine the possible moves for a sliding piece.";
    			t120 = space();
    			pre5 = element("pre");
    			t121 = space();
    			p37 = element("p");
    			p37.textContent = "This is the minimum amount of information that we need to determine moves. For a standard chess game, we have up to 2^8 possible occupancies, which looks something like this:";
    			t123 = space();
    			pre6 = element("pre");
    			t124 = space();
    			p38 = element("p");
    			p38.textContent = "We can actually loop through all possible occupancy states like so:";
    			t126 = space();
    			pre7 = element("pre");
    			t127 = space();
    			p39 = element("p");
    			p39.textContent = "..and precalculate sliding moves for each state! We can store our results in a table like so:";
    			t129 = space();
    			pre8 = element("pre");
    			t130 = space();
    			p40 = element("p");
    			p40.textContent = "All we need now is a way to map each direction (rank, file, diagonal, antidiagonal) to and from the relevant 8 bits. We can use the first rank as a place to extract our relevant bits from the bitboard.";
    			t132 = space();
    			p41 = element("p");
    			p41.textContent = "Say we have a rook on C3 (marked as x) and we want to know where it can go (looking at only the horizontal direction), given the blockers on the board (marked as 1):";
    			t134 = space();
    			pre9 = element("pre");
    			t135 = space();
    			pre10 = element("pre");
    			t136 = space();
    			pre11 = element("pre");
    			t137 = space();
    			p42 = element("p");
    			p42.textContent = "Now we can use the bits at the first rank to index into our table:";
    			t139 = space();
    			pre12 = element("pre");
    			t140 = space();
    			p43 = element("p");
    			p43.textContent = "…And we can map these 8 bits onto the first rank of a bitboard and shift it back up using the same operations in reverse, giving us:";
    			t142 = space();
    			pre13 = element("pre");
    			t143 = space();
    			p44 = element("p");
    			p44.textContent = "…which are the possible moves for our rook on C3! Hooray!";
    			t145 = space();
    			p45 = element("p");
    			p45.textContent = "Similar operations can be done to map between diagonals and the first rank. Again, we need to mask off this bitboard the same way we did earlier to ensure that we don’t attack our own pieces.";
    			t147 = space();
    			p46 = element("p");
    			p46.textContent = "We’re still missing one key aspect: How do we get our moves “out” of a bitboard?";
    			t149 = space();
    			p47 = element("p");
    			p47.textContent = "Simple, just loop through them like so:";
    			t151 = space();
    			pre14 = element("pre");
    			t152 = space();
    			p48 = element("p");
    			p48.textContent = "Apart from the standard rules like encoding how all the pieces move, you also have to consider rules such as the en-passant, castling, and promotions, but these don’t have any fancy tricks like above so I won’t mention it.";
    			t154 = space();
    			h32 = element("h3");
    			h32.textContent = "Testing your move generation";
    			t156 = space();
    			p49 = element("p");
    			em0 = element("em");
    			em0.textContent = "Question";
    			t158 = text(": How do you make sure your move generation is correct? There are so many possible moves, with so many possible boards and responses?");
    			t159 = space();
    			p50 = element("p");
    			em1 = element("em");
    			em1.textContent = "Answer:";
    			t161 = text(" Use perft! This is a function that you write into your chess engine that walks through the game tree, move by move, and recursively counts through all possible moves up to a certain depth. It looks like:");
    			t162 = space();
    			pre15 = element("pre");
    			t163 = space();
    			p51 = element("p");
    			p51.textContent = "For example, perft(0) on the starting position gives us 20, since there are 20 possible moves white can make (2 per pawn, 2 per knight). perft(1) = 40, since the sides are symmetric.";
    			t165 = space();
    			p52 = element("p");
    			p52.textContent = "Here are some more perft values at the starting position:";
    			t167 = space();
    			pre16 = element("pre");
    			t168 = space();
    			p53 = element("p");
    			a11 = element("a");
    			a11.textContent = "Full list here";
    			t170 = space();
    			p54 = element("p");
    			t171 = text("Don’t you just love exponential growth? Chess actually has a branching factor of around 35, meaning there are more possible chess positions ");
    			code2 = element("code");
    			code2.textContent = "(10^120)";
    			t173 = text(" than atoms in the universe ");
    			code3 = element("code");
    			code3.textContent = "(10^81)";
    			t175 = text(".");
    			t176 = space();
    			p55 = element("p");
    			p55.textContent = "Writing a good move generator legitimately took me months (mostly because I didn’t know what I was doing yet). I ended up rewriting this several times, unsatisfied with the performance of each. The first couple tries were in C++, and my time for perft(6) was 5+ minutes on my computer. This was because of a slow move generation algorithm–math instead of lookup tables, and because I was using a slow 256 bit number library (big boards big challenges big thoughts).";
    			t178 = space();
    			p56 = element("p");
    			p56.textContent = "I eventually settled on a final rewrite in Rust, using a faster 256 bit number library and the generation scheme described above, which is providing me with decent speed and efficiency. Perft(6) on the starting position finishes in less than three seconds now. Much better!";
    			t180 = space();
    			h25 = element("h2");
    			h25.textContent = "Evaluation";
    			t182 = space();
    			p57 = element("p");
    			t183 = text("Evaluation is the process of assigning the board a score. It allows the engine to determine what a “good” position means. The score itself is the sum of the player to move’s ");
    			strong0 = element("strong");
    			strong0.textContent = "material score";
    			t185 = text(" and ");
    			strong1 = element("strong");
    			strong1.textContent = "positional score";
    			t187 = text(".");
    			t188 = space();
    			p58 = element("p");
    			t189 = text("The ");
    			strong2 = element("strong");
    			strong2.textContent = "material score";
    			t191 = text(" is just the amount of material that either side has. Protochess measures material in centipawns, which is 1/100ths of a pawn. Using this model, here are the centipawn values for each standard piece:");
    			t192 = space();
    			pre17 = element("pre");
    			t193 = space();
    			p59 = element("p");
    			p59.textContent = "As you can see, we add a bonus for castling moves, while getting checkmated essentially means having -INF score.\nThis works fine for the pieces in a standard chess game, but the whole point of protochess is to design your own pieces, so how do we score those?";
    			t195 = space();
    			p60 = element("p");
    			t196 = text("At the moment, the score for each custom piece is determined as the sum of possible moves that each piece has. For instance, if a piece can move north and south, the score for that piece is simply ");
    			code4 = element("code");
    			code4.textContent = "[northScore + southScore]";
    			t198 = text(".");
    			t199 = space();
    			p61 = element("p");
    			t200 = text("The other part of the evaluation score is the ");
    			strong3 = element("strong");
    			strong3.textContent = "positional score";
    			t202 = text(". Having more pieces than your opponent is important, but so is where those pieces are. It wouldn’t be very good to have all your pieces stuck behind your pawns (called piece development). Normal engines handle this by defining piece-square tables, which are big arrays mapping each tile to a certain point value for each piece.");
    			t203 = space();
    			p62 = element("p");
    			p62.textContent = "Here is an example table for white pawns taken from the chess programming wiki:";
    			t205 = space();
    			pre18 = element("pre");
    			t206 = space();
    			p63 = element("p");
    			p63.textContent = "As you can see, pawns are encouraged to stay in the middle and progress towards the 7th/8th rank so that they can promote.";
    			t208 = space();
    			p64 = element("p");
    			p64.textContent = "This works fine for normal chess, but again protochess is designed to not be normal chess. We can design custom boards of up to 16×16 tiles, so pre-set piece square tables won’t be very useful here. To get around this, piece square tables are generated dynamically for each piece by counting the possible number of moves for each piece on an otherwise empty board. This retains some properties like encouraging pieces to move towards the center (since pieces typically have more moves at the center), but it misses when you try to add things like king safety and pawn structure.";
    			t210 = space();
    			p65 = element("p");
    			p65.textContent = "At the moment, this seems to be good enough to beat your casual chess player, but improvements can definitely be made.";
    			t212 = space();
    			h26 = element("h2");
    			h26.textContent = "Search";
    			t214 = space();
    			p66 = element("p");
    			p66.textContent = "Now on to the “AI” part of the chess engine. Despite the name, it really isn’t very intelligent. Computers are just dumb rocks that we’ve fooled into doing math.";
    			t216 = space();
    			p67 = element("p");
    			p67.textContent = "Here’s how it works:";
    			t218 = space();
    			p68 = element("p");
    			p68.textContent = "At its core the search is a highly optimized version of the minimax algorithm. This algorithm walks through the game tree up to a certain depth, assuming that each player plays optimally. It picks the branch that provides the most benefit to us, while minimizing the benefit of the opposing player.";
    			t220 = space();
    			p69 = element("p");
    			a12 = element("a");
    			a12.textContent = "Here’s a simplified diagram of that behavior";
    			t222 = text(":");
    			t223 = space();
    			img1 = element("img");
    			t224 = space();
    			p70 = element("p");
    			p70.textContent = "Here is that framework applied in a negamax version, which takes advantage of the fact that if black is up by 5 points, then the overall evaluation is just -1 * 5 (hence the name Nega(tive)-(min)max).";
    			t226 = space();
    			pre19 = element("pre");
    			t227 = space();
    			p71 = element("p");
    			p71.textContent = "Now, if you were to build a chess algorithm using a plain min/max with no optimizations, it would still play decent chess, but would likely only be able to search up to 3 ply (3 moves ahead) in a reasonable amount of time. In comparison, the protochess engine currently searches to around 10 ply in ~5s on my machine. For reference, Stockfish regularly searches to 20+ ply using even more optimizations.";
    			t229 = space();
    			p72 = element("p");
    			p72.textContent = "Here’s a list of search optimizations that the protochess engine includes:";
    			t231 = space();
    			ul10 = element("ul");
    			li7 = element("li");
    			t232 = text("Alpha-beta pruning ");
    			ul1 = element("ul");
    			li4 = element("li");
    			li4.textContent = "The idea here is to stop searching moves that automatically lead to a bad position. This is similar to how humans play chess; if we see a move that immedietely leads to a lost position, we naturally stop searching moves that come after it.";
    			t234 = space();
    			li5 = element("li");
    			li5.textContent = "Alpha-beta pruning alone guarantees the same end results as min/max, just with less work done.";
    			t236 = space();
    			li6 = element("li");
    			li6.textContent = "It’s easy to see how if we search better moves first, we are more likely to find a good variation that results in more cutoffs. So much so, that with perfect move ordering, if minmax searches x nodes, then we can expect an alpha-beta search to search only sqrt(x) nodes!";
    			t238 = space();
    			li9 = element("li");
    			t239 = text("Quiescence search");
    			ul2 = element("ul");
    			li8 = element("li");
    			li8.textContent = "Searches can suffer from the horizon effect, which happens when a search reaches its maximum depth but still doesn’t know enough about a position to accurately rate its moves. For instance, at the last depth of a search the engine can find a move that appears good but actually leads to the Queen being lost. To fix this, we simply switch to a Quiescence search (quiet search), meaning we keep searching using only capture moves until we run out of capture moves to make. This solves our problem of dropping pieces and results in a much more reliable engine.";
    			t241 = space();
    			li11 = element("li");
    			t242 = text("Principal Variation Search");
    			ul3 = element("ul");
    			li10 = element("li");
    			li10.textContent = "This search method takes advantage of the fact that it’s easier to prove a move is bad than it is to calculate the full score of a move, so we search the first moves in our list fully, and reduce the search window for subsequent searches.";
    			t244 = space();
    			li13 = element("li");
    			t245 = text("MVV-LVA Move ordering");
    			ul4 = element("ul");
    			li12 = element("li");
    			li12.textContent = "This stands for most-valuable-victim, least-valuable-attacker move ordering. As described above, alpha beta search benefits massively from a good search order. MVV-LVA sorts the moves in each ply to help ensure a good ordering.";
    			t247 = space();
    			li15 = element("li");
    			t248 = text("Killer + History Heuristic");
    			ul5 = element("ul");
    			li14 = element("li");
    			li14.textContent = "These heuristics store moves that caused cutoffs in the past, and whenever the engine encounters them again, the moves are ranked higher in the move ordering.";
    			t250 = space();
    			li17 = element("li");
    			t251 = text("Null move pruning");
    			ul6 = element("ul");
    			li16 = element("li");
    			li16.textContent = "Most of the time, the worst thing you can do in chess is to pass (with some exceptions). As such, null move pruning makes a “null move” (skips turn), and if the engine still can’t find a move that improves the opponent score (beta cutoff), then we know we can ignore the branch.";
    			t253 = space();
    			li19 = element("li");
    			t254 = text("Late move reductions");
    			ul7 = element("ul");
    			li18 = element("li");
    			li18.textContent = "Since our move ordering is pretty good at this point, we can search later moves with reduced depth. This can dramatically improve search depth, but care must be taken to ensure that our search still remains stable.";
    			t256 = space();
    			li21 = element("li");
    			t257 = text("Transposition table with Zobrist Hashing");
    			ul8 = element("ul");
    			li20 = element("li");
    			li20.textContent = "A zobrist hash is a number assigned to a particular board position. It is used similarly to an ID; it is supposed to be unique to the position.\n– These numbers are used to index a big hashtable of positions, where we store information between searches.";
    			t259 = space();
    			li23 = element("li");
    			t260 = text("Iterative deepening");
    			ul9 = element("ul");
    			li22 = element("li");
    			li22.textContent = "Iterative deepening just means that if we want to search to depth x, we first search to depth 1, then 2, then 3, then 4, up to x. At first glance, it may seem like doing a lot of extra work, but in reality the amount of time to search at lower depths is trivial, and it allows us to use information from the shallow searches to help us for our deeper searches (move ordering/transposition table). Additionally, we can stop early and use our low-depth results if we run out of time.";
    			t262 = space();
    			h27 = element("h2");
    			h27.textContent = "Online Play, Website, and Deployment";
    			t264 = space();
    			p73 = element("p");
    			p73.textContent = "Now for the website itself.";
    			t266 = space();
    			p74 = element("p");
    			t267 = text("The frontend was originally written using React, but after watching ");
    			a13 = element("a");
    			a13.textContent = "this video on svelte";
    			t269 = text(" and seeing how simple it was, I switched immediately. Svelte has the added benefit of being a compiler, so the website only serves what it needs (without a virtual DOM). This basically means it should load pretty quickly, which fits the theme of this blog post quite well. I used the ");
    			a14 = element("a");
    			a14.textContent = "Bulma css library";
    			t271 = text(" to get things looking pretty.");
    			t272 = space();
    			p75 = element("p");
    			p75.textContent = "The backend also uses Rust, for no other reason than it seeming like the simplest solution to run our chess logic and webserver using the same language. Looking back, it would’ve been easier to use something like node.js with neon for rust bindings.";
    			t274 = space();
    			p76 = element("p");
    			t275 = text("Since the engine is written in Rust, we can implement singleplayer by simply compiling our code to ");
    			a15 = element("a");
    			a15.textContent = "WebAssembly";
    			t277 = text(" and serving our .wasm file as a static asset, without any extra work! WebAssembly is super cool; it lets you run low level code at almost native speed on the web!");
    			t278 = space();
    			p77 = element("p");
    			t279 = text("As for multiplayer, ");
    			a16 = element("a");
    			a16.textContent = "websockets";
    			t281 = text(" allow for two-way communication between the server and client, enabling features such as realtime chat.");
    			t282 = space();
    			p78 = element("p");
    			p78.textContent = "The whole setup is hosted on DigitalOcean using their free $100 signup credit, with SSL certs from cloudflare.";
    			t284 = space();
    			h33 = element("h3");
    			h33.textContent = "Time Sink";
    			t286 = space();
    			p79 = element("p");
    			p79.textContent = "So this project ended up taking waaaay longer than I thought it would. I expected a month max, but it turns out chess engines are really complicated.";
    			t288 = space();
    			p80 = element("p");
    			p80.textContent = "Here is a screenshot of my git history:";
    			t290 = space();
    			img2 = element("img");
    			t291 = space();
    			p81 = element("p");
    			p81.textContent = "As you can see, I started this project in early March, and just barely finished in July. I had no idea what I was getting into, but in the end I’m happy with how it came out. I rewrote the chess engine ~3 times, each time using more advanced chess-engine-specific techniques.";
    			t293 = space();
    			p82 = element("p");
    			p82.textContent = "There are still a lot of features that would be nice to have, but it’s definitely a usable product.";
    			t295 = space();
    			p83 = element("p");
    			p83.textContent = "Nice-to-have-but-not-implemented list:";
    			t297 = space();
    			ul11 = element("ul");
    			li24 = element("li");
    			li24.textContent = "Account system";
    			t299 = space();
    			li25 = element("li");
    			li25.textContent = "Game history";
    			t301 = space();
    			li26 = element("li");
    			li26.textContent = "Pre-set maps/pieces";
    			t303 = space();
    			p84 = element("p");
    			p84.textContent = "Sidenote: Sometime during the semester, while I was at the gym with Aiden Padilla (not to be confused with Aidan Chambers, the chess boy), between our mindless Spongebob quotes that we spew between sets, we made an agreement that I’d finish the website and that he’d finish his e-bike project by the end of the semester, or else we’d owe each other $5. Well I think between the coronavirus situation and him moving out to Washington, we both failed that challenge. (@Padilla wheres the e-bike tho)";
    			t305 = space();
    			chambers = element("chambers");
    			t306 = text("And Chambers: if you’re reading this, I formally challenge you to a game of protochess.\n");
    			p85 = element("p");
    			p85.textContent = "What is protochess?";
    			t308 = space();
    			p86 = element("p");
    			p86.textContent = "I’m glad you asked, Chambers. You aren’t ready for this one.";
    			t310 = space();
    			p87 = element("p");
    			t311 = text("You might’ve had years of training with your grandfather, but I have ");
    			em2 = element("em");
    			em2.textContent = "6 months worth of training by myself";
    			t313 = text(" most of that time programming instead of playing chess. Message me when you’re ready.");
    			t314 = space();
    			h28 = element("h2");
    			h28.textContent = "The bigger picture";
    			t316 = space();
    			p88 = element("p");
    			t317 = text("There’s something really satisfying about writing a program that beats you in your own game. Recently I watched the ");
    			a17 = element("a");
    			a17.textContent = "AlphaGo documentary";
    			t319 = text(" with Cami, and it’s absolutely incredible. These professional Go players devote their entire lives to improving at the game, which for a long time was considered impossible to write good engines for. That is until AlphaGo came and beat the number one Go player in the world, Lee Sedol.");
    			t320 = space();
    			p89 = element("p");
    			p89.textContent = "And that documentary was about an event that happened four years ago! Now, not only have the AlphaGo team beaten themselves with AlphaGo Zero, similar tech is being used to identify diseases, develop self-driving cars, and change how we do things in almost every field.";
    			t322 = space();
    			p90 = element("p");
    			t323 = text("Sometimes that change isn’t always good, though. I think it’s easy for those within tech to focus solely on the advancement of technology without considering the ethical consequences of their work. ");
    			a18 = element("a");
    			a18.textContent = "Take for instance the case of Robert Julian-Borchak Williams";
    			t325 = text(", who was wrongfully accused for a felony because of the implicit biases within facial recognition technology (which, by the way, is really accurate for white people but not so much minorities). I’m sure none of the engineers behind the technology wanted to target minorities, but the intent doesn’t change the outcome. Without proper auditing of the datasets that we’re using, mistakes like these are bound to happen. ");
    			a19 = element("a");
    			a19.textContent = "(Yes, even to MIT.)";
    			t327 = space();
    			p91 = element("p");
    			p91.textContent = "It’s all fun and games making the computer go beep boop until someone gets hurt.";
    			t329 = space();
    			p92 = element("p");
    			t330 = text("Along the same lines, as consumers of technology we should be mindful of the data that tech companies collect and what they do with it. It’s no surprise that companies sell your data for profit, but I find that most of us don’t know the extent of what they record and what they don’t. ");
    			a20 = element("a");
    			a20.textContent = "TikTok was recently caught recording users’ clipboard information without consent";
    			t332 = text(", among other previous security concerns. This is just one company — how many more are there?");
    			t333 = space();
    			p93 = element("p");
    			t334 = text("You know how it can be harder to write a paper when you have someone sitting behind you watching you type every word? ");
    			a21 = element("a");
    			a21.textContent = "That happens digitally too";
    			t336 = text(". Being under constant surveillance can and will hinder your ability for creative thought.");
    			t337 = space();
    			p94 = element("p");
    			p94.textContent = "But maybe you don’t care. You have nothing to hide, and the TikTok dances are pretty cool so you want to keep watching them.";
    			t339 = space();
    			p95 = element("p");
    			t340 = text("What if these companies start asking for more? What if a health insurance company saw that you watched a lot of TV, so they decide to raise your rates because your inactive lifestyle puts you at greater risk for health problems? ");
    			a22 = element("a");
    			a22.textContent = "No, nevermind, you’re right that’ll never happen";
    			t342 = text(".");
    			t343 = space();
    			p96 = element("p");
    			p96.textContent = "Maybe it is all just harmless advertising. For now.";
    			t345 = space();
    			p97 = element("p");
    			a23 = element("a");
    			a23.textContent = "But just because it isn’t happening to you right now, doesn’t mean it can’t happen";
    			t347 = text(".");
    			t348 = space();
    			p98 = element("p");
    			p98.textContent = "There’s a lot more to say about this but here are some closing thoughts: Be a little more mindful of the technology that you use and especially the privacy policies behind them. Do you really need to have TikTok installed?";
    			t350 = space();
    			p99 = element("p");
    			p99.textContent = "…Also, play on my chess website :)";
    			t352 = space();
    			img3 = element("img");
    			t353 = space();
    			img4 = element("img");
    			t354 = space();
    			p100 = element("p");
    			a24 = element("a");
    			a24.textContent = "Protochess.com";
    			t356 = space();
    			p101 = element("p");
    			a25 = element("a");
    			a25.textContent = "github.com/raytran/protochess";
    			attr_dev(a0, "href", "https://mitadmissions.org/blogs/entry/guest-post-how-to-write-a-chess-variant-website-in-six-months/");
    			attr_dev(a0, "rel", "nofollow");
    			add_location(a0, file$c, 10, 140, 794);
    			add_location(p0, file$c, 10, 0, 654);
    			attr_dev(h1, "id", "title");
    			add_location(h1, file$c, 14, 0, 940);
    			attr_dev(h20, "id", "subtitle");
    			add_location(h20, file$c, 15, 0, 968);
    			attr_dev(a1, "href", "https://protochess.com");
    			attr_dev(a1, "rel", "nofollow");
    			add_location(a1, file$c, 16, 93, 1095);
    			add_location(p1, file$c, 16, 0, 1002);
    			if (iframe.src !== (iframe_src_value = "https://www.youtube.com/embed/ddaMFWH6ppY")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			set_style(iframe, "position", "absolute");
    			set_style(iframe, "top", "0");
    			set_style(iframe, "left", "0");
    			set_style(iframe, "width", "100%");
    			set_style(iframe, "height", "100%");
    			add_location(iframe, file$c, 21, 0, 1297);
    			set_style(div, "position", "relative");
    			set_style(div, "width", "100%");
    			set_style(div, "height", "0");
    			set_style(div, "padding-bottom", "56.25%");
    			add_location(div, file$c, 20, 0, 1217);
    			attr_dev(h21, "id", "the-inspiration");
    			add_location(h21, file$c, 24, 0, 1472);
    			attr_dev(a2, "href", "https://mitadmissions.org/blogs/entry/guest-post-duolingo-champion/");
    			attr_dev(a2, "rel", "nofollow");
    			add_location(a2, file$c, 25, 125, 1643);
    			add_location(p2, file$c, 25, 0, 1518);
    			add_location(p3, file$c, 29, 0, 1765);
    			add_location(p4, file$c, 30, 0, 2106);
    			add_location(p5, file$c, 31, 0, 2251);
    			add_location(p6, file$c, 32, 0, 2401);
    			attr_dev(a3, "href", "https://protochess.com");
    			attr_dev(a3, "rel", "nofollow");
    			add_location(a3, file$c, 33, 70, 2874);
    			add_location(p7, file$c, 33, 0, 2804);
    			attr_dev(h22, "id", "engine");
    			add_location(h22, file$c, 37, 0, 3031);
    			add_location(p8, file$c, 38, 0, 3059);
    			attr_dev(a4, "href", "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-172-performance-engineering-of-software-systems-fall-2018/");
    			attr_dev(a4, "rel", "nofollow");
    			add_location(a4, file$c, 39, 21, 3540);
    			add_location(p9, file$c, 39, 0, 3519);
    			add_location(p10, file$c, 43, 0, 3929);
    			add_location(p11, file$c, 44, 0, 3944);
    			attr_dev(a5, "href", "#board-representation");
    			add_location(a5, file$c, 46, 4, 3999);
    			add_location(li0, file$c, 46, 0, 3995);
    			attr_dev(a6, "href", "#move-generation");
    			add_location(a6, file$c, 47, 4, 4065);
    			add_location(li1, file$c, 47, 0, 4061);
    			attr_dev(a7, "href", "#evaluation");
    			add_location(a7, file$c, 48, 4, 4121);
    			add_location(li2, file$c, 48, 0, 4117);
    			attr_dev(a8, "href", "#search");
    			add_location(a8, file$c, 49, 4, 4167);
    			add_location(li3, file$c, 49, 0, 4163);
    			add_location(ul0, file$c, 45, 0, 3990);
    			attr_dev(h23, "id", "board-representation");
    			add_location(h23, file$c, 51, 0, 4207);
    			add_location(p12, file$c, 52, 0, 4263);
    			add_location(p13, file$c, 53, 0, 4540);
    			attr_dev(pre0, "class", "language-rust");
    			add_location(pre0, file$c, 54, 0, 4687);
    			add_location(p14, file$c, 64, 0, 10298);
    			add_location(p15, file$c, 65, 0, 10500);
    			add_location(p16, file$c, 66, 0, 10643);
    			add_location(p17, file$c, 67, 0, 10875);
    			attr_dev(img0, "alt", "square mapping");
    			set_style(img0, "width", "100%");
    			if (img0.src !== (img0_src_value = "/images/square-mapping-considerations.png")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$c, 68, 0, 11127);
    			attr_dev(a9, "href", "https://www.chessprogramming.org/Square_Mapping_Considerations");
    			attr_dev(a9, "rel", "nofollow");
    			add_location(a9, file$c, 69, 3, 11224);
    			add_location(p18, file$c, 69, 0, 11221);
    			add_location(p19, file$c, 73, 0, 11338);
    			add_location(p20, file$c, 74, 0, 11428);
    			add_location(p21, file$c, 75, 0, 11621);
    			add_location(p22, file$c, 76, 0, 11712);
    			attr_dev(pre1, "class", "language-rust");
    			add_location(pre1, file$c, 77, 0, 11763);
    			add_location(p23, file$c, 85, 0, 17153);
    			attr_dev(pre2, "class", "language-rust");
    			add_location(pre2, file$c, 86, 0, 17224);
    			add_location(p24, file$c, 94, 0, 17646);
    			add_location(p25, file$c, 95, 0, 17810);
    			add_location(code0, file$c, 96, 31, 17950);
    			add_location(code1, file$c, 97, 245, 18350);
    			add_location(p26, file$c, 96, 0, 17919);
    			attr_dev(h24, "id", "move-generation");
    			add_location(h24, file$c, 98, 0, 18393);
    			add_location(p27, file$c, 99, 0, 18439);
    			add_location(p28, file$c, 100, 0, 18614);
    			attr_dev(h30, "id", "jumping-pieces-knight-pawn-king");
    			add_location(h30, file$c, 101, 0, 18920);
    			add_location(p29, file$c, 102, 0, 19002);
    			add_location(p30, file$c, 103, 0, 19209);
    			add_location(p31, file$c, 104, 0, 19499);
    			attr_dev(pre3, "class", "language-rust");
    			add_location(pre3, file$c, 105, 0, 19645);
    			add_location(p32, file$c, 115, 0, 22573);
    			add_location(p33, file$c, 116, 0, 22670);
    			attr_dev(pre4, "class", "language-rust");
    			add_location(pre4, file$c, 118, 0, 22974);
    			add_location(p34, file$c, 122, 0, 23691);
    			attr_dev(h31, "id", "sliding-pieces");
    			add_location(h31, file$c, 123, 0, 23805);
    			attr_dev(a10, "href", "https://www.chessprogramming.org/Magic_Bitboards");
    			attr_dev(a10, "rel", "nofollow");
    			add_location(a10, file$c, 124, 166, 24015);
    			add_location(p35, file$c, 124, 0, 23849);
    			add_location(p36, file$c, 128, 0, 24217);
    			attr_dev(pre5, "class", "language-null");
    			add_location(pre5, file$c, 129, 0, 24328);
    			add_location(p37, file$c, 131, 0, 24501);
    			attr_dev(pre6, "class", "language-null");
    			add_location(pre6, file$c, 132, 0, 24683);
    			add_location(p38, file$c, 133, 0, 24806);
    			attr_dev(pre7, "class", "language-rust");
    			add_location(pre7, file$c, 134, 0, 24881);
    			add_location(p39, file$c, 138, 0, 25420);
    			attr_dev(pre8, "class", "language-rust");
    			add_location(pre8, file$c, 139, 0, 25521);
    			add_location(p40, file$c, 140, 0, 25904);
    			add_location(p41, file$c, 141, 0, 26113);
    			attr_dev(pre9, "class", "language-rust");
    			add_location(pre9, file$c, 142, 0, 26286);
    			attr_dev(pre10, "class", "language-rust");
    			add_location(pre10, file$c, 151, 0, 29005);
    			attr_dev(pre11, "class", "language-rust");
    			add_location(pre11, file$c, 161, 0, 31946);
    			add_location(p42, file$c, 171, 0, 34825);
    			attr_dev(pre12, "class", "language-rust");
    			add_location(pre12, file$c, 172, 0, 34899);
    			add_location(p43, file$c, 176, 0, 35549);
    			attr_dev(pre13, "class", "language-null");
    			add_location(pre13, file$c, 177, 0, 35689);
    			add_location(p44, file$c, 185, 0, 35895);
    			add_location(p45, file$c, 186, 0, 35960);
    			add_location(p46, file$c, 187, 0, 36159);
    			add_location(p47, file$c, 188, 0, 36247);
    			attr_dev(pre14, "class", "language-rust");
    			add_location(pre14, file$c, 189, 0, 36294);
    			add_location(p48, file$c, 198, 0, 38189);
    			attr_dev(h32, "id", "testing-your-move-generation");
    			add_location(h32, file$c, 199, 0, 38419);
    			add_location(em0, file$c, 200, 3, 38494);
    			add_location(p49, file$c, 200, 0, 38491);
    			add_location(em1, file$c, 201, 3, 38652);
    			add_location(p50, file$c, 201, 0, 38649);
    			attr_dev(pre15, "class", "language-rust");
    			add_location(pre15, file$c, 202, 0, 38877);
    			add_location(p51, file$c, 214, 0, 40928);
    			add_location(p52, file$c, 215, 0, 41118);
    			attr_dev(pre16, "class", "language-null");
    			add_location(pre16, file$c, 216, 0, 41183);
    			attr_dev(a11, "href", "https://www.chessprogramming.org/Perft_Results");
    			attr_dev(a11, "rel", "nofollow");
    			add_location(a11, file$c, 226, 3, 41404);
    			add_location(p53, file$c, 226, 0, 41401);
    			add_location(code2, file$c, 230, 143, 41647);
    			add_location(code3, file$c, 230, 192, 41696);
    			add_location(p54, file$c, 230, 0, 41504);
    			add_location(p55, file$c, 231, 0, 41722);
    			add_location(p56, file$c, 232, 0, 42195);
    			attr_dev(h25, "id", "evaluation");
    			add_location(h25, file$c, 233, 0, 42476);
    			add_location(strong0, file$c, 234, 177, 42689);
    			add_location(strong1, file$c, 234, 213, 42725);
    			add_location(p57, file$c, 234, 0, 42512);
    			add_location(strong2, file$c, 235, 7, 42771);
    			add_location(p58, file$c, 235, 0, 42764);
    			attr_dev(pre17, "class", "language-rust");
    			add_location(pre17, file$c, 236, 0, 43006);
    			add_location(p59, file$c, 245, 0, 45474);
    			add_location(code4, file$c, 247, 200, 45941);
    			add_location(p60, file$c, 247, 0, 45741);
    			add_location(strong3, file$c, 248, 49, 46034);
    			add_location(p61, file$c, 248, 0, 45985);
    			add_location(p62, file$c, 249, 0, 46400);
    			attr_dev(pre18, "class", "language-null");
    			add_location(pre18, file$c, 250, 0, 46487);
    			add_location(p63, file$c, 259, 0, 46827);
    			add_location(p64, file$c, 260, 0, 46957);
    			add_location(p65, file$c, 261, 0, 47543);
    			attr_dev(h26, "id", "search");
    			add_location(h26, file$c, 262, 0, 47669);
    			add_location(p66, file$c, 263, 0, 47697);
    			add_location(p67, file$c, 264, 0, 47866);
    			add_location(p68, file$c, 265, 0, 47894);
    			attr_dev(a12, "href", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Minimax.svg/400px-Minimax.svg.png");
    			attr_dev(a12, "rel", "nofollow");
    			add_location(a12, file$c, 266, 3, 48203);
    			add_location(p69, file$c, 266, 0, 48200);
    			attr_dev(img1, "alt", "Minimax behavior");
    			set_style(img1, "width", "100%");
    			if (img1.src !== (img1_src_value = "/images/minimax-diagram.png")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$c, 270, 0, 48379);
    			add_location(p70, file$c, 271, 0, 48461);
    			attr_dev(pre19, "class", "language-rust");
    			add_location(pre19, file$c, 272, 0, 48669);
    			add_location(p71, file$c, 282, 0, 50449);
    			add_location(p72, file$c, 283, 0, 50860);
    			add_location(li4, file$c, 286, 0, 50975);
    			add_location(li5, file$c, 287, 0, 51225);
    			add_location(li6, file$c, 288, 0, 51329);
    			add_location(ul1, file$c, 285, 23, 50970);
    			add_location(li7, file$c, 285, 0, 50947);
    			add_location(li8, file$c, 291, 0, 51646);
    			add_location(ul2, file$c, 290, 21, 51641);
    			add_location(li9, file$c, 290, 0, 51620);
    			add_location(li10, file$c, 294, 0, 52260);
    			add_location(ul3, file$c, 293, 30, 52255);
    			add_location(li11, file$c, 293, 0, 52225);
    			add_location(li12, file$c, 297, 0, 52549);
    			add_location(ul4, file$c, 296, 25, 52544);
    			add_location(li13, file$c, 296, 0, 52519);
    			add_location(li14, file$c, 300, 0, 52832);
    			add_location(ul5, file$c, 299, 30, 52827);
    			add_location(li15, file$c, 299, 0, 52797);
    			add_location(li16, file$c, 303, 0, 53037);
    			add_location(ul6, file$c, 302, 21, 53032);
    			add_location(li17, file$c, 302, 0, 53011);
    			add_location(li18, file$c, 306, 0, 53365);
    			add_location(ul7, file$c, 305, 24, 53360);
    			add_location(li19, file$c, 305, 0, 53336);
    			add_location(li20, file$c, 309, 0, 53649);
    			add_location(ul8, file$c, 308, 44, 53644);
    			add_location(li21, file$c, 308, 0, 53600);
    			add_location(li22, file$c, 313, 0, 53950);
    			add_location(ul9, file$c, 312, 23, 53945);
    			add_location(li23, file$c, 312, 0, 53922);
    			add_location(ul10, file$c, 284, 0, 50942);
    			attr_dev(h27, "id", "online-play-website-and-deployment");
    			add_location(h27, file$c, 316, 0, 54458);
    			add_location(p73, file$c, 317, 0, 54544);
    			attr_dev(a13, "href", "https://www.youtube.com/watch?v=AdNJ3fydeao");
    			attr_dev(a13, "rel", "nofollow");
    			add_location(a13, file$c, 318, 71, 54650);
    			attr_dev(a14, "href", "https://bulma.io/");
    			attr_dev(a14, "rel", "nofollow");
    			add_location(a14, file$c, 321, 310, 55033);
    			add_location(p74, file$c, 318, 0, 54579);
    			add_location(p75, file$c, 325, 0, 55137);
    			attr_dev(a15, "href", "https://www.rust-lang.org/what/wasm");
    			attr_dev(a15, "rel", "nofollow");
    			add_location(a15, file$c, 326, 102, 55496);
    			add_location(p76, file$c, 326, 0, 55394);
    			attr_dev(a16, "href", "https://en.wikipedia.org/wiki/WebSocket");
    			attr_dev(a16, "rel", "nofollow");
    			add_location(a16, file$c, 330, 23, 55768);
    			add_location(p77, file$c, 330, 0, 55745);
    			add_location(p78, file$c, 334, 0, 55961);
    			attr_dev(h33, "id", "time-sink");
    			add_location(h33, file$c, 335, 0, 56079);
    			add_location(p79, file$c, 336, 0, 56113);
    			add_location(p80, file$c, 337, 0, 56270);
    			attr_dev(img2, "alt", "github screenshot");
    			set_style(img2, "width", "100%");
    			if (img2.src !== (img2_src_value = "/images/raytran-github.png")) attr_dev(img2, "src", img2_src_value);
    			add_location(img2, file$c, 338, 0, 56317);
    			add_location(p81, file$c, 339, 0, 56399);
    			add_location(p82, file$c, 340, 0, 56682);
    			add_location(p83, file$c, 341, 0, 56789);
    			add_location(li24, file$c, 343, 0, 56840);
    			add_location(li25, file$c, 344, 0, 56864);
    			add_location(li26, file$c, 345, 0, 56886);
    			add_location(ul11, file$c, 342, 0, 56835);
    			add_location(p84, file$c, 347, 0, 56921);
    			add_location(p85, file$c, 350, 0, 57525);
    			add_location(p86, file$c, 351, 0, 57552);
    			add_location(em2, file$c, 352, 72, 57692);
    			add_location(p87, file$c, 352, 0, 57620);
    			add_location(chambers, file$c, 348, 0, 57426);
    			attr_dev(h28, "id", "the-bigger-picture");
    			add_location(h28, file$c, 354, 0, 57840);
    			attr_dev(a17, "href", "https://www.youtube.com/watch?v=WXuK6gekU1Y");
    			attr_dev(a17, "rel", "nofollow");
    			add_location(a17, file$c, 355, 119, 58011);
    			add_location(p88, file$c, 355, 0, 57892);
    			add_location(p89, file$c, 359, 0, 58399);
    			attr_dev(a18, "href", "https://www.nytimes.com/2020/06/24/technology/facial-recognition-arrest.html");
    			attr_dev(a18, "rel", "nofollow");
    			add_location(a18, file$c, 360, 201, 58877);
    			attr_dev(a19, "href", "https://www.theregister.com/2020/07/01/mit_dataset_removed/");
    			attr_dev(a19, "rel", "nofollow");
    			add_location(a19, file$c, 363, 484, 59467);
    			add_location(p90, file$c, 360, 0, 58676);
    			add_location(p91, file$c, 367, 0, 59585);
    			attr_dev(a20, "href", "https://www.forbes.com/sites/zakdoffman/2020/06/26/warning-apple-suddenly-catches-tiktok-secretly-spying-on-millions-of-iphone-users/#29fd52ca34ef");
    			attr_dev(a20, "rel", "nofollow");
    			add_location(a20, file$c, 368, 288, 59961);
    			add_location(p92, file$c, 368, 0, 59673);
    			attr_dev(a21, "href", "https://www.socialcooling.com/");
    			attr_dev(a21, "rel", "nofollow");
    			add_location(a21, file$c, 372, 121, 60442);
    			add_location(p93, file$c, 372, 0, 60321);
    			add_location(p94, file$c, 376, 0, 60628);
    			attr_dev(a22, "href", "https://www.propublica.org/article/health-insurers-are-vacuuming-up-details-about-you-and-it-could-raise-your-rates");
    			attr_dev(a22, "rel", "nofollow");
    			add_location(a22, file$c, 377, 232, 60992);
    			add_location(p95, file$c, 377, 0, 60760);
    			add_location(p96, file$c, 381, 0, 61196);
    			attr_dev(a23, "href", "https://time.com/collection/davos-2019/5502592/china-social-credit-score/");
    			attr_dev(a23, "rel", "nofollow");
    			add_location(a23, file$c, 382, 3, 61258);
    			add_location(p97, file$c, 382, 0, 61255);
    			add_location(p98, file$c, 386, 0, 61454);
    			add_location(p99, file$c, 387, 0, 61684);
    			attr_dev(img3, "alt", "site screenshot");
    			set_style(img3, "width", "100%");
    			if (img3.src !== (img3_src_value = "/images/protochess1.png")) attr_dev(img3, "src", img3_src_value);
    			add_location(img3, file$c, 388, 0, 61726);
    			attr_dev(img4, "alt", "site screenshot2");
    			set_style(img4, "width", "100%");
    			if (img4.src !== (img4_src_value = "/images/protochess2.png")) attr_dev(img4, "src", img4_src_value);
    			add_location(img4, file$c, 389, 0, 61803);
    			attr_dev(a24, "href", "https://protochess.com");
    			attr_dev(a24, "rel", "nofollow");
    			add_location(a24, file$c, 390, 3, 61884);
    			add_location(p100, file$c, 390, 0, 61881);
    			attr_dev(a25, "href", "https://github.com/raytran");
    			attr_dev(a25, "rel", "nofollow");
    			add_location(a25, file$c, 391, 3, 61958);
    			add_location(p101, file$c, 391, 0, 61955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, a0);
    			append_dev(p0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t8);
    			append_dev(p1, a1);
    			append_dev(p1, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t15);
    			append_dev(p2, a2);
    			append_dev(p2, t17);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, p6, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, p7, anchor);
    			append_dev(p7, t27);
    			append_dev(p7, a3);
    			append_dev(p7, t29);
    			insert_dev(target, t30, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, p8, anchor);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, p9, anchor);
    			append_dev(p9, t35);
    			append_dev(p9, a4);
    			append_dev(p9, t37);
    			insert_dev(target, t38, anchor);
    			insert_dev(target, p10, anchor);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, p11, anchor);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(li0, a5);
    			append_dev(ul0, t44);
    			append_dev(ul0, li1);
    			append_dev(li1, a6);
    			append_dev(ul0, t46);
    			append_dev(ul0, li2);
    			append_dev(li2, a7);
    			append_dev(ul0, t48);
    			append_dev(ul0, li3);
    			append_dev(li3, a8);
    			insert_dev(target, t50, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t52, anchor);
    			insert_dev(target, p12, anchor);
    			insert_dev(target, t54, anchor);
    			insert_dev(target, p13, anchor);
    			insert_dev(target, t56, anchor);
    			insert_dev(target, pre0, anchor);
    			pre0.innerHTML = raw0_value;
    			insert_dev(target, t57, anchor);
    			insert_dev(target, p14, anchor);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, p15, anchor);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, p16, anchor);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, p17, anchor);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, img0, anchor);
    			insert_dev(target, t66, anchor);
    			insert_dev(target, p18, anchor);
    			append_dev(p18, a9);
    			insert_dev(target, t68, anchor);
    			insert_dev(target, p19, anchor);
    			insert_dev(target, t70, anchor);
    			insert_dev(target, p20, anchor);
    			insert_dev(target, t72, anchor);
    			insert_dev(target, p21, anchor);
    			insert_dev(target, t74, anchor);
    			insert_dev(target, p22, anchor);
    			insert_dev(target, t76, anchor);
    			insert_dev(target, pre1, anchor);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t77, anchor);
    			insert_dev(target, p23, anchor);
    			insert_dev(target, t79, anchor);
    			insert_dev(target, pre2, anchor);
    			pre2.innerHTML = raw2_value;
    			insert_dev(target, t80, anchor);
    			insert_dev(target, p24, anchor);
    			insert_dev(target, t82, anchor);
    			insert_dev(target, p25, anchor);
    			insert_dev(target, t84, anchor);
    			insert_dev(target, p26, anchor);
    			append_dev(p26, t85);
    			append_dev(p26, code0);
    			append_dev(p26, t87);
    			append_dev(p26, code1);
    			append_dev(p26, t89);
    			insert_dev(target, t90, anchor);
    			insert_dev(target, h24, anchor);
    			insert_dev(target, t92, anchor);
    			insert_dev(target, p27, anchor);
    			insert_dev(target, t94, anchor);
    			insert_dev(target, p28, anchor);
    			insert_dev(target, t96, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t98, anchor);
    			insert_dev(target, p29, anchor);
    			insert_dev(target, t100, anchor);
    			insert_dev(target, p30, anchor);
    			insert_dev(target, t102, anchor);
    			insert_dev(target, p31, anchor);
    			insert_dev(target, t104, anchor);
    			insert_dev(target, pre3, anchor);
    			pre3.innerHTML = raw3_value;
    			insert_dev(target, t105, anchor);
    			insert_dev(target, p32, anchor);
    			insert_dev(target, t107, anchor);
    			insert_dev(target, p33, anchor);
    			insert_dev(target, t109, anchor);
    			insert_dev(target, pre4, anchor);
    			pre4.innerHTML = raw4_value;
    			insert_dev(target, t110, anchor);
    			insert_dev(target, p34, anchor);
    			insert_dev(target, t112, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t114, anchor);
    			insert_dev(target, p35, anchor);
    			append_dev(p35, t115);
    			append_dev(p35, a10);
    			append_dev(p35, t117);
    			insert_dev(target, t118, anchor);
    			insert_dev(target, p36, anchor);
    			insert_dev(target, t120, anchor);
    			insert_dev(target, pre5, anchor);
    			pre5.innerHTML = raw5_value;
    			insert_dev(target, t121, anchor);
    			insert_dev(target, p37, anchor);
    			insert_dev(target, t123, anchor);
    			insert_dev(target, pre6, anchor);
    			pre6.innerHTML = raw6_value;
    			insert_dev(target, t124, anchor);
    			insert_dev(target, p38, anchor);
    			insert_dev(target, t126, anchor);
    			insert_dev(target, pre7, anchor);
    			pre7.innerHTML = raw7_value;
    			insert_dev(target, t127, anchor);
    			insert_dev(target, p39, anchor);
    			insert_dev(target, t129, anchor);
    			insert_dev(target, pre8, anchor);
    			pre8.innerHTML = raw8_value;
    			insert_dev(target, t130, anchor);
    			insert_dev(target, p40, anchor);
    			insert_dev(target, t132, anchor);
    			insert_dev(target, p41, anchor);
    			insert_dev(target, t134, anchor);
    			insert_dev(target, pre9, anchor);
    			pre9.innerHTML = raw9_value;
    			insert_dev(target, t135, anchor);
    			insert_dev(target, pre10, anchor);
    			pre10.innerHTML = raw10_value;
    			insert_dev(target, t136, anchor);
    			insert_dev(target, pre11, anchor);
    			pre11.innerHTML = raw11_value;
    			insert_dev(target, t137, anchor);
    			insert_dev(target, p42, anchor);
    			insert_dev(target, t139, anchor);
    			insert_dev(target, pre12, anchor);
    			pre12.innerHTML = raw12_value;
    			insert_dev(target, t140, anchor);
    			insert_dev(target, p43, anchor);
    			insert_dev(target, t142, anchor);
    			insert_dev(target, pre13, anchor);
    			pre13.innerHTML = raw13_value;
    			insert_dev(target, t143, anchor);
    			insert_dev(target, p44, anchor);
    			insert_dev(target, t145, anchor);
    			insert_dev(target, p45, anchor);
    			insert_dev(target, t147, anchor);
    			insert_dev(target, p46, anchor);
    			insert_dev(target, t149, anchor);
    			insert_dev(target, p47, anchor);
    			insert_dev(target, t151, anchor);
    			insert_dev(target, pre14, anchor);
    			pre14.innerHTML = raw14_value;
    			insert_dev(target, t152, anchor);
    			insert_dev(target, p48, anchor);
    			insert_dev(target, t154, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t156, anchor);
    			insert_dev(target, p49, anchor);
    			append_dev(p49, em0);
    			append_dev(p49, t158);
    			insert_dev(target, t159, anchor);
    			insert_dev(target, p50, anchor);
    			append_dev(p50, em1);
    			append_dev(p50, t161);
    			insert_dev(target, t162, anchor);
    			insert_dev(target, pre15, anchor);
    			pre15.innerHTML = raw15_value;
    			insert_dev(target, t163, anchor);
    			insert_dev(target, p51, anchor);
    			insert_dev(target, t165, anchor);
    			insert_dev(target, p52, anchor);
    			insert_dev(target, t167, anchor);
    			insert_dev(target, pre16, anchor);
    			pre16.innerHTML = raw16_value;
    			insert_dev(target, t168, anchor);
    			insert_dev(target, p53, anchor);
    			append_dev(p53, a11);
    			insert_dev(target, t170, anchor);
    			insert_dev(target, p54, anchor);
    			append_dev(p54, t171);
    			append_dev(p54, code2);
    			append_dev(p54, t173);
    			append_dev(p54, code3);
    			append_dev(p54, t175);
    			insert_dev(target, t176, anchor);
    			insert_dev(target, p55, anchor);
    			insert_dev(target, t178, anchor);
    			insert_dev(target, p56, anchor);
    			insert_dev(target, t180, anchor);
    			insert_dev(target, h25, anchor);
    			insert_dev(target, t182, anchor);
    			insert_dev(target, p57, anchor);
    			append_dev(p57, t183);
    			append_dev(p57, strong0);
    			append_dev(p57, t185);
    			append_dev(p57, strong1);
    			append_dev(p57, t187);
    			insert_dev(target, t188, anchor);
    			insert_dev(target, p58, anchor);
    			append_dev(p58, t189);
    			append_dev(p58, strong2);
    			append_dev(p58, t191);
    			insert_dev(target, t192, anchor);
    			insert_dev(target, pre17, anchor);
    			pre17.innerHTML = raw17_value;
    			insert_dev(target, t193, anchor);
    			insert_dev(target, p59, anchor);
    			insert_dev(target, t195, anchor);
    			insert_dev(target, p60, anchor);
    			append_dev(p60, t196);
    			append_dev(p60, code4);
    			append_dev(p60, t198);
    			insert_dev(target, t199, anchor);
    			insert_dev(target, p61, anchor);
    			append_dev(p61, t200);
    			append_dev(p61, strong3);
    			append_dev(p61, t202);
    			insert_dev(target, t203, anchor);
    			insert_dev(target, p62, anchor);
    			insert_dev(target, t205, anchor);
    			insert_dev(target, pre18, anchor);
    			pre18.innerHTML = raw18_value;
    			insert_dev(target, t206, anchor);
    			insert_dev(target, p63, anchor);
    			insert_dev(target, t208, anchor);
    			insert_dev(target, p64, anchor);
    			insert_dev(target, t210, anchor);
    			insert_dev(target, p65, anchor);
    			insert_dev(target, t212, anchor);
    			insert_dev(target, h26, anchor);
    			insert_dev(target, t214, anchor);
    			insert_dev(target, p66, anchor);
    			insert_dev(target, t216, anchor);
    			insert_dev(target, p67, anchor);
    			insert_dev(target, t218, anchor);
    			insert_dev(target, p68, anchor);
    			insert_dev(target, t220, anchor);
    			insert_dev(target, p69, anchor);
    			append_dev(p69, a12);
    			append_dev(p69, t222);
    			insert_dev(target, t223, anchor);
    			insert_dev(target, img1, anchor);
    			insert_dev(target, t224, anchor);
    			insert_dev(target, p70, anchor);
    			insert_dev(target, t226, anchor);
    			insert_dev(target, pre19, anchor);
    			pre19.innerHTML = raw19_value;
    			insert_dev(target, t227, anchor);
    			insert_dev(target, p71, anchor);
    			insert_dev(target, t229, anchor);
    			insert_dev(target, p72, anchor);
    			insert_dev(target, t231, anchor);
    			insert_dev(target, ul10, anchor);
    			append_dev(ul10, li7);
    			append_dev(li7, t232);
    			append_dev(li7, ul1);
    			append_dev(ul1, li4);
    			append_dev(ul1, t234);
    			append_dev(ul1, li5);
    			append_dev(ul1, t236);
    			append_dev(ul1, li6);
    			append_dev(ul10, t238);
    			append_dev(ul10, li9);
    			append_dev(li9, t239);
    			append_dev(li9, ul2);
    			append_dev(ul2, li8);
    			append_dev(ul10, t241);
    			append_dev(ul10, li11);
    			append_dev(li11, t242);
    			append_dev(li11, ul3);
    			append_dev(ul3, li10);
    			append_dev(ul10, t244);
    			append_dev(ul10, li13);
    			append_dev(li13, t245);
    			append_dev(li13, ul4);
    			append_dev(ul4, li12);
    			append_dev(ul10, t247);
    			append_dev(ul10, li15);
    			append_dev(li15, t248);
    			append_dev(li15, ul5);
    			append_dev(ul5, li14);
    			append_dev(ul10, t250);
    			append_dev(ul10, li17);
    			append_dev(li17, t251);
    			append_dev(li17, ul6);
    			append_dev(ul6, li16);
    			append_dev(ul10, t253);
    			append_dev(ul10, li19);
    			append_dev(li19, t254);
    			append_dev(li19, ul7);
    			append_dev(ul7, li18);
    			append_dev(ul10, t256);
    			append_dev(ul10, li21);
    			append_dev(li21, t257);
    			append_dev(li21, ul8);
    			append_dev(ul8, li20);
    			append_dev(ul10, t259);
    			append_dev(ul10, li23);
    			append_dev(li23, t260);
    			append_dev(li23, ul9);
    			append_dev(ul9, li22);
    			insert_dev(target, t262, anchor);
    			insert_dev(target, h27, anchor);
    			insert_dev(target, t264, anchor);
    			insert_dev(target, p73, anchor);
    			insert_dev(target, t266, anchor);
    			insert_dev(target, p74, anchor);
    			append_dev(p74, t267);
    			append_dev(p74, a13);
    			append_dev(p74, t269);
    			append_dev(p74, a14);
    			append_dev(p74, t271);
    			insert_dev(target, t272, anchor);
    			insert_dev(target, p75, anchor);
    			insert_dev(target, t274, anchor);
    			insert_dev(target, p76, anchor);
    			append_dev(p76, t275);
    			append_dev(p76, a15);
    			append_dev(p76, t277);
    			insert_dev(target, t278, anchor);
    			insert_dev(target, p77, anchor);
    			append_dev(p77, t279);
    			append_dev(p77, a16);
    			append_dev(p77, t281);
    			insert_dev(target, t282, anchor);
    			insert_dev(target, p78, anchor);
    			insert_dev(target, t284, anchor);
    			insert_dev(target, h33, anchor);
    			insert_dev(target, t286, anchor);
    			insert_dev(target, p79, anchor);
    			insert_dev(target, t288, anchor);
    			insert_dev(target, p80, anchor);
    			insert_dev(target, t290, anchor);
    			insert_dev(target, img2, anchor);
    			insert_dev(target, t291, anchor);
    			insert_dev(target, p81, anchor);
    			insert_dev(target, t293, anchor);
    			insert_dev(target, p82, anchor);
    			insert_dev(target, t295, anchor);
    			insert_dev(target, p83, anchor);
    			insert_dev(target, t297, anchor);
    			insert_dev(target, ul11, anchor);
    			append_dev(ul11, li24);
    			append_dev(ul11, t299);
    			append_dev(ul11, li25);
    			append_dev(ul11, t301);
    			append_dev(ul11, li26);
    			insert_dev(target, t303, anchor);
    			insert_dev(target, p84, anchor);
    			insert_dev(target, t305, anchor);
    			insert_dev(target, chambers, anchor);
    			append_dev(chambers, t306);
    			append_dev(chambers, p85);
    			append_dev(chambers, t308);
    			append_dev(chambers, p86);
    			append_dev(chambers, t310);
    			append_dev(chambers, p87);
    			append_dev(p87, t311);
    			append_dev(p87, em2);
    			append_dev(p87, t313);
    			insert_dev(target, t314, anchor);
    			insert_dev(target, h28, anchor);
    			insert_dev(target, t316, anchor);
    			insert_dev(target, p88, anchor);
    			append_dev(p88, t317);
    			append_dev(p88, a17);
    			append_dev(p88, t319);
    			insert_dev(target, t320, anchor);
    			insert_dev(target, p89, anchor);
    			insert_dev(target, t322, anchor);
    			insert_dev(target, p90, anchor);
    			append_dev(p90, t323);
    			append_dev(p90, a18);
    			append_dev(p90, t325);
    			append_dev(p90, a19);
    			insert_dev(target, t327, anchor);
    			insert_dev(target, p91, anchor);
    			insert_dev(target, t329, anchor);
    			insert_dev(target, p92, anchor);
    			append_dev(p92, t330);
    			append_dev(p92, a20);
    			append_dev(p92, t332);
    			insert_dev(target, t333, anchor);
    			insert_dev(target, p93, anchor);
    			append_dev(p93, t334);
    			append_dev(p93, a21);
    			append_dev(p93, t336);
    			insert_dev(target, t337, anchor);
    			insert_dev(target, p94, anchor);
    			insert_dev(target, t339, anchor);
    			insert_dev(target, p95, anchor);
    			append_dev(p95, t340);
    			append_dev(p95, a22);
    			append_dev(p95, t342);
    			insert_dev(target, t343, anchor);
    			insert_dev(target, p96, anchor);
    			insert_dev(target, t345, anchor);
    			insert_dev(target, p97, anchor);
    			append_dev(p97, a23);
    			append_dev(p97, t347);
    			insert_dev(target, t348, anchor);
    			insert_dev(target, p98, anchor);
    			insert_dev(target, t350, anchor);
    			insert_dev(target, p99, anchor);
    			insert_dev(target, t352, anchor);
    			insert_dev(target, img3, anchor);
    			insert_dev(target, t353, anchor);
    			insert_dev(target, img4, anchor);
    			insert_dev(target, t354, anchor);
    			insert_dev(target, p100, anchor);
    			append_dev(p100, a24);
    			insert_dev(target, t356, anchor);
    			insert_dev(target, p101, anchor);
    			append_dev(p101, a25);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t30);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(p9);
    			if (detaching) detach_dev(t38);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t50);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t52);
    			if (detaching) detach_dev(p12);
    			if (detaching) detach_dev(t54);
    			if (detaching) detach_dev(p13);
    			if (detaching) detach_dev(t56);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(p14);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(p15);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(p16);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(p17);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(img0);
    			if (detaching) detach_dev(t66);
    			if (detaching) detach_dev(p18);
    			if (detaching) detach_dev(t68);
    			if (detaching) detach_dev(p19);
    			if (detaching) detach_dev(t70);
    			if (detaching) detach_dev(p20);
    			if (detaching) detach_dev(t72);
    			if (detaching) detach_dev(p21);
    			if (detaching) detach_dev(t74);
    			if (detaching) detach_dev(p22);
    			if (detaching) detach_dev(t76);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t77);
    			if (detaching) detach_dev(p23);
    			if (detaching) detach_dev(t79);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t80);
    			if (detaching) detach_dev(p24);
    			if (detaching) detach_dev(t82);
    			if (detaching) detach_dev(p25);
    			if (detaching) detach_dev(t84);
    			if (detaching) detach_dev(p26);
    			if (detaching) detach_dev(t90);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t92);
    			if (detaching) detach_dev(p27);
    			if (detaching) detach_dev(t94);
    			if (detaching) detach_dev(p28);
    			if (detaching) detach_dev(t96);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t98);
    			if (detaching) detach_dev(p29);
    			if (detaching) detach_dev(t100);
    			if (detaching) detach_dev(p30);
    			if (detaching) detach_dev(t102);
    			if (detaching) detach_dev(p31);
    			if (detaching) detach_dev(t104);
    			if (detaching) detach_dev(pre3);
    			if (detaching) detach_dev(t105);
    			if (detaching) detach_dev(p32);
    			if (detaching) detach_dev(t107);
    			if (detaching) detach_dev(p33);
    			if (detaching) detach_dev(t109);
    			if (detaching) detach_dev(pre4);
    			if (detaching) detach_dev(t110);
    			if (detaching) detach_dev(p34);
    			if (detaching) detach_dev(t112);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t114);
    			if (detaching) detach_dev(p35);
    			if (detaching) detach_dev(t118);
    			if (detaching) detach_dev(p36);
    			if (detaching) detach_dev(t120);
    			if (detaching) detach_dev(pre5);
    			if (detaching) detach_dev(t121);
    			if (detaching) detach_dev(p37);
    			if (detaching) detach_dev(t123);
    			if (detaching) detach_dev(pre6);
    			if (detaching) detach_dev(t124);
    			if (detaching) detach_dev(p38);
    			if (detaching) detach_dev(t126);
    			if (detaching) detach_dev(pre7);
    			if (detaching) detach_dev(t127);
    			if (detaching) detach_dev(p39);
    			if (detaching) detach_dev(t129);
    			if (detaching) detach_dev(pre8);
    			if (detaching) detach_dev(t130);
    			if (detaching) detach_dev(p40);
    			if (detaching) detach_dev(t132);
    			if (detaching) detach_dev(p41);
    			if (detaching) detach_dev(t134);
    			if (detaching) detach_dev(pre9);
    			if (detaching) detach_dev(t135);
    			if (detaching) detach_dev(pre10);
    			if (detaching) detach_dev(t136);
    			if (detaching) detach_dev(pre11);
    			if (detaching) detach_dev(t137);
    			if (detaching) detach_dev(p42);
    			if (detaching) detach_dev(t139);
    			if (detaching) detach_dev(pre12);
    			if (detaching) detach_dev(t140);
    			if (detaching) detach_dev(p43);
    			if (detaching) detach_dev(t142);
    			if (detaching) detach_dev(pre13);
    			if (detaching) detach_dev(t143);
    			if (detaching) detach_dev(p44);
    			if (detaching) detach_dev(t145);
    			if (detaching) detach_dev(p45);
    			if (detaching) detach_dev(t147);
    			if (detaching) detach_dev(p46);
    			if (detaching) detach_dev(t149);
    			if (detaching) detach_dev(p47);
    			if (detaching) detach_dev(t151);
    			if (detaching) detach_dev(pre14);
    			if (detaching) detach_dev(t152);
    			if (detaching) detach_dev(p48);
    			if (detaching) detach_dev(t154);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t156);
    			if (detaching) detach_dev(p49);
    			if (detaching) detach_dev(t159);
    			if (detaching) detach_dev(p50);
    			if (detaching) detach_dev(t162);
    			if (detaching) detach_dev(pre15);
    			if (detaching) detach_dev(t163);
    			if (detaching) detach_dev(p51);
    			if (detaching) detach_dev(t165);
    			if (detaching) detach_dev(p52);
    			if (detaching) detach_dev(t167);
    			if (detaching) detach_dev(pre16);
    			if (detaching) detach_dev(t168);
    			if (detaching) detach_dev(p53);
    			if (detaching) detach_dev(t170);
    			if (detaching) detach_dev(p54);
    			if (detaching) detach_dev(t176);
    			if (detaching) detach_dev(p55);
    			if (detaching) detach_dev(t178);
    			if (detaching) detach_dev(p56);
    			if (detaching) detach_dev(t180);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t182);
    			if (detaching) detach_dev(p57);
    			if (detaching) detach_dev(t188);
    			if (detaching) detach_dev(p58);
    			if (detaching) detach_dev(t192);
    			if (detaching) detach_dev(pre17);
    			if (detaching) detach_dev(t193);
    			if (detaching) detach_dev(p59);
    			if (detaching) detach_dev(t195);
    			if (detaching) detach_dev(p60);
    			if (detaching) detach_dev(t199);
    			if (detaching) detach_dev(p61);
    			if (detaching) detach_dev(t203);
    			if (detaching) detach_dev(p62);
    			if (detaching) detach_dev(t205);
    			if (detaching) detach_dev(pre18);
    			if (detaching) detach_dev(t206);
    			if (detaching) detach_dev(p63);
    			if (detaching) detach_dev(t208);
    			if (detaching) detach_dev(p64);
    			if (detaching) detach_dev(t210);
    			if (detaching) detach_dev(p65);
    			if (detaching) detach_dev(t212);
    			if (detaching) detach_dev(h26);
    			if (detaching) detach_dev(t214);
    			if (detaching) detach_dev(p66);
    			if (detaching) detach_dev(t216);
    			if (detaching) detach_dev(p67);
    			if (detaching) detach_dev(t218);
    			if (detaching) detach_dev(p68);
    			if (detaching) detach_dev(t220);
    			if (detaching) detach_dev(p69);
    			if (detaching) detach_dev(t223);
    			if (detaching) detach_dev(img1);
    			if (detaching) detach_dev(t224);
    			if (detaching) detach_dev(p70);
    			if (detaching) detach_dev(t226);
    			if (detaching) detach_dev(pre19);
    			if (detaching) detach_dev(t227);
    			if (detaching) detach_dev(p71);
    			if (detaching) detach_dev(t229);
    			if (detaching) detach_dev(p72);
    			if (detaching) detach_dev(t231);
    			if (detaching) detach_dev(ul10);
    			if (detaching) detach_dev(t262);
    			if (detaching) detach_dev(h27);
    			if (detaching) detach_dev(t264);
    			if (detaching) detach_dev(p73);
    			if (detaching) detach_dev(t266);
    			if (detaching) detach_dev(p74);
    			if (detaching) detach_dev(t272);
    			if (detaching) detach_dev(p75);
    			if (detaching) detach_dev(t274);
    			if (detaching) detach_dev(p76);
    			if (detaching) detach_dev(t278);
    			if (detaching) detach_dev(p77);
    			if (detaching) detach_dev(t282);
    			if (detaching) detach_dev(p78);
    			if (detaching) detach_dev(t284);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t286);
    			if (detaching) detach_dev(p79);
    			if (detaching) detach_dev(t288);
    			if (detaching) detach_dev(p80);
    			if (detaching) detach_dev(t290);
    			if (detaching) detach_dev(img2);
    			if (detaching) detach_dev(t291);
    			if (detaching) detach_dev(p81);
    			if (detaching) detach_dev(t293);
    			if (detaching) detach_dev(p82);
    			if (detaching) detach_dev(t295);
    			if (detaching) detach_dev(p83);
    			if (detaching) detach_dev(t297);
    			if (detaching) detach_dev(ul11);
    			if (detaching) detach_dev(t303);
    			if (detaching) detach_dev(p84);
    			if (detaching) detach_dev(t305);
    			if (detaching) detach_dev(chambers);
    			if (detaching) detach_dev(t314);
    			if (detaching) detach_dev(h28);
    			if (detaching) detach_dev(t316);
    			if (detaching) detach_dev(p88);
    			if (detaching) detach_dev(t320);
    			if (detaching) detach_dev(p89);
    			if (detaching) detach_dev(t322);
    			if (detaching) detach_dev(p90);
    			if (detaching) detach_dev(t327);
    			if (detaching) detach_dev(p91);
    			if (detaching) detach_dev(t329);
    			if (detaching) detach_dev(p92);
    			if (detaching) detach_dev(t333);
    			if (detaching) detach_dev(p93);
    			if (detaching) detach_dev(t337);
    			if (detaching) detach_dev(p94);
    			if (detaching) detach_dev(t339);
    			if (detaching) detach_dev(p95);
    			if (detaching) detach_dev(t343);
    			if (detaching) detach_dev(p96);
    			if (detaching) detach_dev(t345);
    			if (detaching) detach_dev(p97);
    			if (detaching) detach_dev(t348);
    			if (detaching) detach_dev(p98);
    			if (detaching) detach_dev(t350);
    			if (detaching) detach_dev(p99);
    			if (detaching) detach_dev(t352);
    			if (detaching) detach_dev(img3);
    			if (detaching) detach_dev(t353);
    			if (detaching) detach_dev(img4);
    			if (detaching) detach_dev(t354);
    			if (detaching) detach_dev(p100);
    			if (detaching) detach_dev(t356);
    			if (detaching) detach_dev(p101);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$3];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$8] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new ProjectPage({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$3)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$3 = {
    	"title": "Protochess.com",
    	"subtitle": "How to write a chess engine in 6 months.",
    	"published": "2020-06-3",
    	"author": "raytran",
    	"thumbnail": "protochess1.png",
    	"summary": "Online multiplayer chess website that lets you build custom pieces/boards. Written in Svelte + Rust.\n",
    	"layout": "blog",
    	"tags": "personal, multiplayer, website, webassembly, rust, svelte"
    };

    const { title: title$3, subtitle, published: published$3, author: author$3, thumbnail: thumbnail$3, summary: summary$3, layout: layout$4, tags: tags$3 } = metadata$3;

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Protochess", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Protochess> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$3,
    		title: title$3,
    		subtitle,
    		published: published$3,
    		author: author$3,
    		thumbnail: thumbnail$3,
    		summary: summary$3,
    		layout: layout$4,
    		tags: tags$3,
    		Layout_MDSVEX_DEFAULT: ProjectPage
    	});

    	return [];
    }

    class Protochess extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Protochess",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }
    Protochess.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"subtitle","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"published","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"author","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"thumbnail","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"tags","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var protochess = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Protochess,
        metadata: metadata$3
    });

    /* src/pages/projects/_layout.svelte generated by Svelte v3.31.0 */

    const file$d = "src/pages/projects/_layout.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "container");
    			add_location(div, file$d, 1, 0, 34);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }
    Layout.$compile = {"vars":[]};

    var _layout = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Layout
    });

    /* src/pages/timeline/index.md generated by Svelte v3.31.0 */
    const file$e = "src/pages/timeline/index.md";

    // (6:0) <Layout_MDSVEX_DEFAULT>
    function create_default_slot$9(ctx) {
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let ul0;
    	let li0;
    	let t5;
    	let h21;
    	let t7;
    	let ul1;
    	let li1;
    	let t9;
    	let h22;
    	let t11;
    	let ul2;
    	let li2;
    	let t13;
    	let li3;
    	let t15;
    	let li4;
    	let t17;
    	let li5;
    	let t19;
    	let li6;
    	let t21;
    	let li7;
    	let t23;
    	let h23;
    	let t25;
    	let ul3;
    	let li8;
    	let t27;
    	let li9;
    	let t29;
    	let li10;
    	let t31;
    	let li11;
    	let t33;
    	let li12;
    	let t35;
    	let h24;
    	let t37;
    	let ul4;
    	let li13;
    	let t39;
    	let h25;
    	let t41;
    	let ul5;
    	let li14;
    	let t43;
    	let li15;
    	let t45;
    	let li16;
    	let t47;
    	let li17;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Timeline";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Spring 2021";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "coming soon";
    			t5 = space();
    			h21 = element("h2");
    			h21.textContent = "IAP 2021";
    			t7 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			li1.textContent = "Battlecode! Team: Download more RAM";
    			t9 = space();
    			h22 = element("h2");
    			h22.textContent = "Fall 2020";
    			t11 = space();
    			ul2 = element("ul");
    			li2 = element("li");
    			li2.textContent = "6.002 Circuits and Electronics";
    			t13 = space();
    			li3 = element("li");
    			li3.textContent = "6.031 Elements of Software Construction";
    			t15 = space();
    			li4 = element("li");
    			li4.textContent = "6.004 Computation Structures";
    			t17 = space();
    			li5 = element("li");
    			li5.textContent = "6.036 Intro to Machine Learning";
    			t19 = space();
    			li6 = element("li");
    			li6.textContent = "21M.361 Electronic Music Composition";
    			t21 = space();
    			li7 = element("li");
    			li7.textContent = "15.S20 3D printing seminar";
    			t23 = space();
    			h23 = element("h2");
    			h23.textContent = "Spring 2019";
    			t25 = space();
    			ul3 = element("ul");
    			li8 = element("li");
    			li8.textContent = "6.006 Intro to Algorithms";
    			t27 = space();
    			li9 = element("li");
    			li9.textContent = "6.009 Fundamentals of Programming";
    			t29 = space();
    			li10 = element("li");
    			li10.textContent = "6.08 Embedded Systems";
    			t31 = space();
    			li11 = element("li");
    			li11.textContent = "18.03 Differential Equations";
    			t33 = space();
    			li12 = element("li");
    			li12.textContent = "9.00 Intro Psychology";
    			t35 = space();
    			h24 = element("h2");
    			h24.textContent = "IAP 2020";
    			t37 = space();
    			ul4 = element("ul");
    			li13 = element("li");
    			li13.textContent = "6.117 Intro to EE Lab Skills";
    			t39 = space();
    			h25 = element("h2");
    			h25.textContent = "Fall 2019";
    			t41 = space();
    			ul5 = element("ul");
    			li14 = element("li");
    			li14.textContent = "18.02 Multivariable Calculus";
    			t43 = space();
    			li15 = element("li");
    			li15.textContent = "8.02 Physics 2";
    			t45 = space();
    			li16 = element("li");
    			li16.textContent = "6.042 Math for CS";
    			t47 = space();
    			li17 = element("li");
    			li17.textContent = "21A.461 What is Capitalism?";
    			attr_dev(h1, "id", "timeline");
    			add_location(h1, file$e, 6, 0, 127);
    			attr_dev(h20, "id", "spring-2021");
    			add_location(h20, file$e, 7, 0, 159);
    			add_location(li0, file$e, 9, 0, 202);
    			add_location(ul0, file$e, 8, 0, 197);
    			attr_dev(h21, "id", "iap-2021");
    			add_location(h21, file$e, 11, 0, 229);
    			add_location(li1, file$e, 13, 0, 266);
    			add_location(ul1, file$e, 12, 0, 261);
    			attr_dev(h22, "id", "fall-2020");
    			add_location(h22, file$e, 15, 0, 317);
    			add_location(li2, file$e, 17, 0, 356);
    			add_location(li3, file$e, 18, 0, 396);
    			add_location(li4, file$e, 19, 0, 445);
    			add_location(li5, file$e, 20, 0, 483);
    			add_location(li6, file$e, 21, 0, 524);
    			add_location(li7, file$e, 22, 0, 570);
    			add_location(ul2, file$e, 16, 0, 351);
    			attr_dev(h23, "id", "spring-2019");
    			add_location(h23, file$e, 24, 0, 612);
    			add_location(li8, file$e, 26, 0, 655);
    			add_location(li9, file$e, 27, 0, 690);
    			add_location(li10, file$e, 28, 0, 733);
    			add_location(li11, file$e, 29, 0, 764);
    			add_location(li12, file$e, 30, 0, 802);
    			add_location(ul3, file$e, 25, 0, 650);
    			attr_dev(h24, "id", "iap-2020");
    			add_location(h24, file$e, 33, 0, 840);
    			add_location(li13, file$e, 35, 0, 877);
    			add_location(ul4, file$e, 34, 0, 872);
    			attr_dev(h25, "id", "fall-2019");
    			add_location(h25, file$e, 37, 0, 921);
    			add_location(li14, file$e, 39, 0, 960);
    			add_location(li15, file$e, 40, 0, 998);
    			add_location(li16, file$e, 41, 0, 1022);
    			add_location(li17, file$e, 42, 0, 1049);
    			add_location(ul5, file$e, 38, 0, 955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, ul2, anchor);
    			append_dev(ul2, li2);
    			append_dev(ul2, t13);
    			append_dev(ul2, li3);
    			append_dev(ul2, t15);
    			append_dev(ul2, li4);
    			append_dev(ul2, t17);
    			append_dev(ul2, li5);
    			append_dev(ul2, t19);
    			append_dev(ul2, li6);
    			append_dev(ul2, t21);
    			append_dev(ul2, li7);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, ul3, anchor);
    			append_dev(ul3, li8);
    			append_dev(ul3, t27);
    			append_dev(ul3, li9);
    			append_dev(ul3, t29);
    			append_dev(ul3, li10);
    			append_dev(ul3, t31);
    			append_dev(ul3, li11);
    			append_dev(ul3, t33);
    			append_dev(ul3, li12);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, h24, anchor);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, ul4, anchor);
    			append_dev(ul4, li13);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, h25, anchor);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, ul5, anchor);
    			append_dev(ul5, li14);
    			append_dev(ul5, t43);
    			append_dev(ul5, li15);
    			append_dev(ul5, t45);
    			append_dev(ul5, li16);
    			append_dev(ul5, t47);
    			append_dev(ul5, li17);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(ul1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(ul2);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(ul3);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(ul4);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(ul5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(6:0) <Layout_MDSVEX_DEFAULT>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let layout_mdsvex_default;
    	let current;

    	layout_mdsvex_default = new Card({
    			props: {
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Timeline", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Layout_MDSVEX_DEFAULT: Card });
    	return [];
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timeline",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }
    Timeline.$compile = {"vars":[{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var index$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Timeline
    });

    /* src/pages/timeline/_layout.svelte generated by Svelte v3.31.0 */

    const file$f = "src/pages/timeline/_layout.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "container");
    			add_location(div, file$f, 1, 0, 34);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Layout$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }
    Layout$1.$compile = {"vars":[]};

    var _layout$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Layout$1
    });

    /* src/pages/_navigation.svelte generated by Svelte v3.31.0 */
    const file$g = "src/pages/_navigation.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i][0];
    	child_ctx[7] = list[i][1];
    	return child_ctx;
    }

    // (84:4) {#each _links as [path, name]}
    function create_each_block$4(ctx) {
    	let a;
    	let t0_value = /*name*/ ctx[7] + "";
    	let t0;
    	let t1;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", "link svelte-1n2bfvc");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[2](/*path*/ ctx[6]));
    			toggle_class(a, "active", /*$isActive*/ ctx[1](/*path*/ ctx[6]));
    			add_location(a, file$g, 84, 6, 1595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url*/ 4 && a_href_value !== (a_href_value = /*$url*/ ctx[2](/*path*/ ctx[6]))) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$isActive, _links*/ 10) {
    				toggle_class(a, "active", /*$isActive*/ ctx[1](/*path*/ ctx[6]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(84:4) {#each _links as [path, name]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let aside;
    	let nav0;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let nav1;
    	let mounted;
    	let dispose;
    	let each_value = /*_links*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			nav0 = element("nav");
    			div0 = element("div");
    			div0.textContent = "☰";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "raytran.dev";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			nav1 = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "burger svelte-1n2bfvc");
    			add_location(div0, file$g, 78, 4, 1389);
    			attr_dev(div1, "class", "title svelte-1n2bfvc");
    			add_location(div1, file$g, 79, 4, 1445);
    			attr_dev(div2, "class", "svelte-1n2bfvc");
    			add_location(div2, file$g, 80, 4, 1486);
    			attr_dev(nav0, "class", "mobile-nav svelte-1n2bfvc");
    			add_location(nav0, file$g, 77, 2, 1360);
    			attr_dev(nav1, "class", "svelte-1n2bfvc");
    			toggle_class(nav1, "show", /*show*/ ctx[0]);
    			add_location(nav1, file$g, 82, 2, 1505);
    			attr_dev(aside, "class", "svelte-1n2bfvc");
    			add_location(aside, file$g, 76, 0, 1350);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, nav0);
    			append_dev(nav0, div0);
    			append_dev(nav0, t1);
    			append_dev(nav0, div1);
    			append_dev(nav0, t3);
    			append_dev(nav0, div2);
    			append_dev(aside, t4);
    			append_dev(aside, nav1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*handleBurger*/ ctx[4], false, false, false),
    					listen_dev(nav1, "click", /*click_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url, _links, $isActive*/ 14) {
    				each_value = /*_links*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(nav1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*show*/ 1) {
    				toggle_class(nav1, "show", /*show*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $isActive;
    	let $url;
    	validate_store(isActive, "isActive");
    	component_subscribe($$self, isActive, $$value => $$invalidate(1, $isActive = $$value));
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(2, $url = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navigation", slots, []);
    	let show = false;
    	const _links = [["./index", "Home"], ["./projects", "Projects"], ["./timeline", "Timeline"]];

    	function handleBurger() {
    		$$invalidate(0, show = !show);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, show = false);

    	$$self.$capture_state = () => ({
    		url,
    		isActive,
    		show,
    		_links,
    		handleBurger,
    		$isActive,
    		$url
    	});

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, $isActive, $url, _links, handleBurger, click_handler];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }
    Navigation.$compile = {"vars":[{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"isActive","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"show","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"_links","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"handleBurger","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"$isActive","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"$url","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    /* src/pages/_layout.svelte generated by Svelte v3.31.0 */
    const file$h = "src/pages/_layout.svelte";

    function create_fragment$j(ctx) {
    	let div;
    	let navigation;
    	let t;
    	let current;
    	navigation = new Navigation({ $$inline: true });
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navigation.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    			add_location(div, file$h, 8, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navigation, div, null);
    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navigation);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $page;
    	validate_store(page, "page");
    	component_subscribe($$self, page, $$value => $$invalidate(0, $page = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, ['default']);
    	metatags.description = "Description coming soon...";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ metatags, page, Navigation, $page });

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$page*/ 1) {
    			 metatags.title = `My Routify app - ${$page.title}`;
    		}
    	};

    	return [$page, $$scope, slots];
    }

    class Layout$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }
    Layout$2.$compile = {"vars":[{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"page","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"Navigation","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"$page","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false}]};

    var _layout$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Layout$2
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
