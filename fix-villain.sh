#!/bin/bash
# Fix CoffeeScript 2.x syntax in villain submodule

echo "Fixing villain submodule for CoffeeScript 2.x compatibility..."

# Fix bare super calls
perl -i -pe 's/^(\s*)super$/\1super()/g' node_modules/villain/world/net/client.coffee
perl -i -pe 's/^(\s*)super$/\1super()/g' node_modules/villain/world/net/server.coffee

# Fix constructor in object.coffee - manual replacement
cat > /tmp/villain_object_fix.coffee << 'EOF'
  constructor: (world) ->
    super()
    @world = world
EOF

sed -i '' '/constructor: (@world) ->/r /tmp/villain_object_fix.coffee' node_modules/villain/world/object.coffee
sed -i '' '/constructor: (@world) ->/d' node_modules/villain/world/object.coffee

echo "✓ Villain submodule fixed"
